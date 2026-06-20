import type { Snippet } from "./types";

export const pythonFinanceSnippets20260620B1: Snippet[] = [
  {
    id: "pyfin-20260620-b1-longstaff-schwartz",
    language: "python",
    title: "Longstaff-Schwartz American option pricing (LSM)",
    tag: "derivatives",
    code: `import numpy as np

def lsm_american_put(S0, K, r, sigma, T, n_steps=50, n_paths=50_000, seed=42):
    """
    Longstaff-Schwartz (2001) least-squares Monte Carlo for American puts.
    Regresses continuation value on in-the-money paths at each exercise date.
    """
    rng = np.random.default_rng(seed)
    dt   = T / n_steps
    disc = np.exp(-r * dt)

    # Simulate paths
    Z  = rng.standard_normal((n_steps, n_paths))
    S  = np.zeros((n_steps + 1, n_paths))
    S[0] = S0
    for t in range(1, n_steps + 1):
        S[t] = S[t-1] * np.exp((r - 0.5*sigma**2)*dt + sigma*np.sqrt(dt)*Z[t-1])

    # Cash flow matrix: initialise at terminal payoff
    CF = np.maximum(K - S[-1], 0.0)

    # Backward induction
    for t in range(n_steps - 1, 0, -1):
        itm = S[t] < K                            # in-the-money mask
        if itm.sum() == 0:
            CF *= disc
            continue
        X = S[t, itm]
        Y = CF[itm] * disc                        # discounted future CFs

        # Basis functions: [1, X, X^2] — Laguerre polynomials also common
        A = np.column_stack([np.ones_like(X), X, X**2])
        beta, *_ = np.linalg.lstsq(A, Y, rcond=None)
        continuation = A @ beta

        exercise = K - X                          # immediate exercise value
        exercise_now = exercise > continuation
        CF[itm] = np.where(exercise_now, exercise, Y)  # choose better
        CF[~itm] *= disc

    return np.exp(-r * dt) * CF.mean()`,
    explanation: "LSM avoids the exponential grid of a tree by regressing the continuation value on a small basis of the current stock price; using only in-the-money paths in the regression avoids extrapolation, and the simple polynomial basis is sufficient for smooth payoffs.",
  },
  {
    id: "pyfin-20260620-b1-ois-bootstrap",
    language: "python",
    title: "OIS/SOFR curve bootstrapping from overnight swap rates",
    tag: "fixed-income",
    code: `import numpy as np
from scipy.interpolate import interp1d

def bootstrap_ois(maturities: list[float], swap_rates: list[float]) -> interp1d:
    """
    Bootstrap a discount curve from OIS swap rates (annual, act/360).
    maturities: list of swap tenors in years (e.g. [0.25, 0.5, 1, 2, 5])
    swap_rates: corresponding fixed rates (e.g. [0.0520, 0.0515, 0.0495, ...])
    Returns a discount factor interpolator.
    """
    times = sorted(zip(maturities, swap_rates))
    tenors = [t for t, _ in times]
    rates  = [r for _, r in times]

    df = {}   # discount factors keyed by tenor

    for i, (T, R) in enumerate(zip(tenors, rates)):
        if i == 0:
            # Short end: simple discount
            df[T] = 1.0 / (1.0 + R * T)
        else:
            # Solve: R * sum(df[t_k] * dt_k) + df[T] = 1
            prev_tenors = tenors[:i]
            dt_prev = [prev_tenors[0]] + [prev_tenors[j] - prev_tenors[j-1]
                                           for j in range(1, len(prev_tenors))]
            annuity = sum(R * df[prev_tenors[j]] * dt_prev[j]
                         for j in range(len(prev_tenors)))
            last_dt = T - tenors[i-1]
            df[T] = (1.0 - annuity) / (1.0 + R * last_dt)

    t_arr  = np.array([0.0] + tenors)
    df_arr = np.array([1.0] + [df[t] for t in tenors])

    # Log-linear interpolation preserves positivity of discount factors
    log_df = np.log(df_arr)
    return interp1d(t_arr, log_df, kind='linear',
                    fill_value='extrapolate',
                    bounds_error=False)

# Usage: log_df_fn = bootstrap_ois([0.25,0.5,1,2,5], [0.052,0.051,0.049,0.046,0.042])
# DF(T) = np.exp(log_df_fn(T))`,
    explanation: "OIS bootstrapping extracts a discount curve from the fixed rates of overnight index swaps by solving for each discount factor in maturity order; log-linear interpolation between pillars preserves positivity and gives a smooth, arbitrage-free forward rate curve.",
  },
  {
    id: "pyfin-20260620-b1-credit-migration",
    language: "python",
    title: "Credit rating migration matrix and multi-year survival probability",
    tag: "credit",
    code: `import numpy as np
from scipy.linalg import logm, expm

# Standard Moody's-style 1-year migration matrix (8x8: Aaa..Caa, Default)
# Rows = from-rating, cols = to-rating, Default is absorbing state
M1 = np.array([
    [0.9091, 0.0802, 0.0071, 0.0026, 0.0000, 0.0000, 0.0000, 0.0010],
    [0.0062, 0.9108, 0.0763, 0.0052, 0.0006, 0.0000, 0.0000, 0.0009],
    [0.0005, 0.0196, 0.9115, 0.0605, 0.0060, 0.0010, 0.0000, 0.0009],
    [0.0003, 0.0025, 0.0450, 0.8997, 0.0381, 0.0101, 0.0019, 0.0024],
    [0.0001, 0.0006, 0.0054, 0.0691, 0.8563, 0.0620, 0.0049, 0.0016],
    [0.0000, 0.0010, 0.0024, 0.0203, 0.1113, 0.7908, 0.0539, 0.0203],
    [0.0000, 0.0002, 0.0013, 0.0081, 0.0219, 0.1062, 0.7966, 0.0657],
    [0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 1.0000],
])

def multi_year_migration(M_annual: np.ndarray, years: int) -> np.ndarray:
    """Raise migration matrix to the n-th power for multi-year transitions."""
    return np.linalg.matrix_power(M_annual, years)

def generator_matrix(M: np.ndarray) -> np.ndarray:
    """Extract continuous-time generator Q from M = exp(Q*1yr)."""
    return logm(M).real   # principal matrix logarithm

def survival_probability(M: np.ndarray, from_rating: int, T: float) -> float:
    """
    Probability of not defaulting over T years starting from rating 'from_rating'.
    Uses the generator matrix for non-integer T.
    """
    Q  = generator_matrix(M)
    Mt = expm(Q * T)             # M(T) = exp(Q*T)
    return 1.0 - Mt[from_rating, -1]  # last column = default probability

# Example: Baa (index 3) 5-year survival
print(f"Baa 5yr survival: {survival_probability(M1, 3, 5):.4f}")`,
    explanation: "The continuous-time generator Q = log(M) allows interpolation to non-integer horizons via M(t) = exp(Q·t), which is essential for CDO tranches or bond options with settlement dates that don't align to annual migration periods.",
  },
  {
    id: "pyfin-20260620-b1-vix-calc",
    language: "python",
    title: "VIX-style implied variance calculation from options strip",
    tag: "derivatives",
    code: `import numpy as np

def vix_implied_variance(strikes: np.ndarray, mid_prices: np.ndarray,
                          F: float, T: float, r: float) -> float:
    """
    CBOE VIX methodology: sigma^2 = (2/T) * sum_i (dK_i/K_i^2) * exp(rT) * Q_i
                                    - (1/T) * (F/K0 - 1)^2
    strikes: sorted array of option strikes
    mid_prices: corresponding mid option prices (put for K < F, call for K > F)
    F: forward price
    T: time to expiry in years
    """
    K0_idx = np.searchsorted(strikes, F) - 1
    K0 = strikes[K0_idx]

    # Compute dK for each strike (average of adjacent intervals, endpoints half)
    dK = np.zeros_like(strikes, dtype=float)
    dK[0]  = strikes[1] - strikes[0]
    dK[-1] = strikes[-1] - strikes[-2]
    for i in range(1, len(strikes) - 1):
        dK[i] = (strikes[i+1] - strikes[i-1]) / 2.0

    # Contribution: (dK/K^2) * exp(rT) * price
    contrib = (dK / strikes**2) * np.exp(r * T) * mid_prices
    sigma2 = (2.0 / T) * contrib.sum()

    # Subtract forward-ATM adjustment
    sigma2 -= (1.0 / T) * (F / K0 - 1.0)**2

    return sigma2   # annualised variance; VIX = 100 * sqrt(sigma2)`,
    explanation: "The VIX formula weights OTM option prices by dK/K² to approximate a log-contract payoff; the model-free nature means no Black-Scholes assumption is needed — any diffusive model with continuous paths gives the same formula up to the forward-ATM correction.",
  },
  {
    id: "pyfin-20260620-b1-basket-mc",
    language: "python",
    title: "Multi-asset basket option MC with Cholesky correlation",
    tag: "derivatives",
    code: `import numpy as np

def basket_call_mc(S0: np.ndarray, weights: np.ndarray,
                   K: float, r: float, sigma: np.ndarray,
                   corr: np.ndarray, T: float,
                   n_paths: int = 100_000, seed: int = 42) -> float:
    """
    European basket call: payoff = max(w'*S_T - K, 0).
    S0, sigma, weights: arrays of shape (n_assets,)
    corr: correlation matrix (n_assets x n_assets)
    """
    rng = np.random.default_rng(seed)
    n = len(S0)
    L = np.linalg.cholesky(corr)               # correlate normal draws

    Z_ind = rng.standard_normal((n_paths, n))
    Z     = Z_ind @ L.T                         # (n_paths, n_assets), correlated

    # Log-normal terminal prices
    drift = (r - 0.5 * sigma**2) * T
    diff  = sigma * np.sqrt(T) * Z
    ST    = S0 * np.exp(drift + diff)           # (n_paths, n_assets)

    basket = ST @ weights                        # (n_paths,) basket value
    payoff = np.maximum(basket - K, 0.0)
    return float(np.exp(-r * T) * payoff.mean())

# Example: equal-weight basket of 3 assets
if __name__ == "__main__":
    S0 = np.array([100.0, 100.0, 100.0])
    w  = np.array([1/3, 1/3, 1/3])
    sig = np.array([0.20, 0.25, 0.18])
    corr = np.array([[1.0, 0.6, 0.4],
                     [0.6, 1.0, 0.5],
                     [0.4, 0.5, 1.0]])
    price = basket_call_mc(S0, w, K=100.0, r=0.05, sigma=sig,
                           corr=corr, T=1.0)
    print(f"Basket call price: {price:.4f}")`,
    explanation: "Basket options have no closed form because the sum of log-normals is not log-normal; the Cholesky decomposition of the correlation matrix maps independent standard normals to correlated asset returns, and the MC price converges at rate 1/√N.",
  },
  {
    id: "pyfin-20260620-b1-sortino-calmar",
    language: "python",
    title: "Sortino, Calmar and Omega ratio calculations",
    tag: "risk",
    code: `import numpy as np

def performance_ratios(returns: np.ndarray, mar: float = 0.0,
                        freq: int = 252) -> dict:
    """
    returns: daily return array
    mar: minimum acceptable return (daily), default 0
    freq: trading days per year
    """
    ann_ret  = returns.mean() * freq
    ann_vol  = returns.std()  * np.sqrt(freq)

    # Sortino: penalises only downside deviations below MAR
    downside = np.minimum(returns - mar, 0.0)
    downside_std = np.sqrt((downside**2).mean()) * np.sqrt(freq)
    sortino = (ann_ret - mar * freq) / downside_std if downside_std > 0 else np.inf

    # Maximum drawdown from cumulative wealth
    cum = np.cumprod(1.0 + returns)
    roll_max = np.maximum.accumulate(cum)
    drawdowns = (cum - roll_max) / roll_max
    max_dd = float(drawdowns.min())

    # Calmar: annualised return / abs(max drawdown)
    calmar = ann_ret / abs(max_dd) if max_dd != 0 else np.inf

    # Omega: ratio of gains above threshold to losses below threshold
    gains  = np.maximum(returns - mar, 0.0).sum()
    losses = np.maximum(mar - returns, 0.0).sum()
    omega  = gains / losses if losses > 0 else np.inf

    sharpe = (ann_ret - 0.0) / ann_vol if ann_vol > 0 else np.inf

    return dict(sharpe=sharpe, sortino=sortino, calmar=calmar,
                omega=omega, max_drawdown=max_dd,
                ann_return=ann_ret, ann_vol=ann_vol)`,
    explanation: "Sortino is preferred over Sharpe for strategies with positive skew (options selling, trend following) because it ignores upside volatility; Calmar is favoured by CTA evaluators because drawdown duration and depth are the primary risk metric for leveraged futures accounts.",
  },
  {
    id: "pyfin-20260620-b1-hrp",
    language: "python",
    title: "Hierarchical Risk Parity (HRP) portfolio construction",
    tag: "portfolio",
    code: `import numpy as np
from scipy.cluster.hierarchy import linkage, to_tree
from scipy.spatial.distance import squareform

def hrp_weights(cov: np.ndarray) -> np.ndarray:
    """
    Lopez de Prado (2016) HRP: cluster assets by correlation, then
    allocate inverse-variance weights within each cluster recursively.
    """
    n = cov.shape[0]
    corr = cov / np.outer(np.sqrt(np.diag(cov)), np.sqrt(np.diag(cov)))
    dist = np.sqrt(0.5 * (1 - corr))          # distance matrix

    # Hierarchical clustering (Ward linkage)
    link = linkage(squareform(dist), method='single')
    root, nodes = to_tree(link, rd=True)

    # Quasi-diagonalise: sort assets by dendrogram leaf order
    def get_leaves(node):
        if node.is_leaf(): return [node.id]
        return get_leaves(node.left) + get_leaves(node.right)
    order = get_leaves(root)

    # Recursive bisection: split clusters, allocate by inverse variance
    weights = np.ones(n)

    def bisect(items, alloc):
        if len(items) == 1:
            weights[items[0]] = alloc
            return
        mid = len(items) // 2
        left, right = items[:mid], items[mid:]
        def cluster_var(idx):
            sub_cov = cov[np.ix_(idx, idx)]
            w = 1.0 / np.diag(sub_cov)
            w /= w.sum()
            return float(w @ sub_cov @ w)
        v_l, v_r = cluster_var(left), cluster_var(right)
        alpha = 1.0 - v_l / (v_l + v_r)    # right cluster gets alpha
        bisect(left,  alloc * (1 - alpha))
        bisect(right, alloc * alpha)

    bisect(order, 1.0)
    return weights / weights.sum()`,
    explanation: "HRP avoids the matrix inversion in classical mean-variance (sensitive to estimation error) by using the correlation structure only for clustering, then allocating capital via inverse-variance bisection — it is naïve-diversified within clusters and diversified-across clusters.",
  },
  {
    id: "pyfin-20260620-b1-arima-spread",
    language: "python",
    title: "ARIMA spread model for pairs trading signals",
    tag: "stat-arb",
    code: `import numpy as np
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.stattools import adfuller

def arima_pairs_signal(spread: np.ndarray, order=(1,1,1),
                        z_entry=2.0, z_exit=0.5) -> np.ndarray:
    """
    Fit ARIMA to the spread, generate z-score signals.
    Returns array of positions: +1 (long spread), -1 (short spread), 0 (flat).
    """
    # ADF test: only trade if spread is stationary (I(0)) or I(1)
    adf_pval = adfuller(spread, maxlag=5, autolag='AIC')[1]
    if adf_pval > 0.10:
        print(f"Warning: ADF p={adf_pval:.3f}, spread may not be stationary")

    model = ARIMA(spread, order=order)
    result = model.fit()

    # One-step-ahead residuals (in-sample innovations)
    resid = result.resid
    mu    = resid.rolling(window=60, min_periods=20).mean()
    sigma = resid.rolling(window=60, min_periods=20).std()
    z     = (resid - mu) / sigma

    positions = np.zeros(len(spread))
    for i in range(1, len(z)):
        prev = positions[i-1]
        if np.isnan(z[i]):
            positions[i] = 0
        elif prev == 0:
            if z[i] < -z_entry:  positions[i] =  1   # spread too low → buy
            elif z[i] >  z_entry: positions[i] = -1  # spread too high → sell
        elif prev == 1 and z[i] > -z_exit:  positions[i] = 0
        elif prev == -1 and z[i] < z_exit:  positions[i] = 0
        else: positions[i] = prev
    return positions`,
    explanation: "ARIMA residuals capture the unexplained component of the spread after removing autocorrelation structure; using a rolling window for the z-score normalisation makes the signal adaptive to slowly changing spread dynamics without refitting the ARIMA model daily.",
  },
  {
    id: "pyfin-20260620-b1-brinson-attribution",
    language: "python",
    title: "Brinson-Hood-Beebower return attribution",
    tag: "portfolio",
    code: `import numpy as np
import pandas as pd

def brinson_attribution(
        portfolio_weights: np.ndarray,
        benchmark_weights: np.ndarray,
        portfolio_returns: np.ndarray,
        benchmark_returns: np.ndarray,
) -> pd.DataFrame:
    """
    Brinson-Hood-Beebower (1986) attribution decomposed into:
    - Allocation effect:  (wp - wb) * rb
    - Selection effect:   wb * (rp - rb)
    - Interaction effect: (wp - wb) * (rp - rb)
    wp, wb: portfolio / benchmark sector weights
    rp, rb: portfolio / benchmark sector returns
    """
    wb, wp = benchmark_weights, portfolio_weights
    rb, rp = benchmark_returns, portfolio_returns
    rb_total = (wb * rb).sum()   # benchmark total return

    allocation   = (wp - wb) * rb                    # over/under-weight decision
    selection    = wb * (rp - rb)                    # security selection within sector
    interaction  = (wp - wb) * (rp - rb)             # joint effect

    active_return = (wp * rp).sum() - rb_total

    df = pd.DataFrame({
        'portfolio_weight': wp,
        'benchmark_weight': wb,
        'portfolio_return': rp,
        'benchmark_return': rb,
        'allocation':  allocation,
        'selection':   selection,
        'interaction': interaction,
        'total_active': allocation + selection + interaction,
    })
    df.loc['Total'] = df[['allocation','selection','interaction','total_active']].sum()
    assert abs(df.loc['Total', 'total_active'] - active_return) < 1e-10
    return df`,
    explanation: "BHB attribution decomposes active return into three orthogonal sources: the allocation term measures the value of tilting sector weights, the selection term measures stock picking within each sector, and their sum reconciles exactly to the total active return without a residual.",
  },
  {
    id: "pyfin-20260620-b1-cvar-cvxpy",
    language: "python",
    title: "CVaR portfolio optimisation with CVXPY",
    tag: "portfolio",
    code: `import numpy as np
import cvxpy as cp

def cvar_optimal_portfolio(mu: np.ndarray, scenarios: np.ndarray,
                            beta: float = 0.95,
                            min_return: float = 0.0) -> np.ndarray:
    """
    Minimise CVaR at level beta subject to minimum expected return.
    scenarios: (n_scenarios, n_assets) matrix of simulated returns
    Returns optimal portfolio weights.
    """
    n_s, n = scenarios.shape
    w  = cp.Variable(n, nonneg=True)           # long-only weights
    z  = cp.Variable(n_s, nonneg=True)         # auxiliary for CVaR
    eta = cp.Variable()                         # VaR level

    # Portfolio loss per scenario
    loss = -scenarios @ w                       # (n_s,) losses

    # CVaR = eta + 1/((1-beta)*n_s) * sum(max(loss - eta, 0))
    # LP reformulation: z_i >= loss_i - eta, z_i >= 0
    cvar = eta + (1.0 / ((1 - beta) * n_s)) * cp.sum(z)

    constraints = [
        cp.sum(w) == 1,                         # fully invested
        z >= loss - eta,                        # CVaR auxiliary
        scenarios @ w @ np.ones(n_s) / n_s >= min_return,  # min expected return
    ]
    # Correct expected return constraint:
    er_constraint = [mu @ w >= min_return]

    prob = cp.Problem(cp.Minimize(cvar), constraints + er_constraint)
    prob.solve(solver=cp.CLARABEL)

    if prob.status not in ('optimal', 'optimal_inaccurate'):
        raise RuntimeError(f"CVaR optimisation failed: {prob.status}")
    return w.value`,
    explanation: "Minimising CVaR (Expected Shortfall) is a convex problem after the Rockafellar-Uryasev linearisation, converting the max() into auxiliary variables z_i — this LP formulation scales to thousands of scenarios and hundreds of assets without gradient approximations.",
  },
  {
    id: "pyfin-20260620-b1-varswap-replication",
    language: "python",
    title: "Variance swap replication from options strip",
    tag: "derivatives",
    code: `import numpy as np
from scipy.interpolate import interp1d

def varswap_fair_strike(F: float, T: float, r: float,
                         strikes: np.ndarray, call_prices: np.ndarray,
                         put_prices: np.ndarray) -> float:
    """
    Model-free variance swap fair strike (annualised vol units).
    Uses OTM puts below F and OTM calls above F.
    Integration via trapezoidal rule over (dK / K^2).
    """
    # Split strikes at the forward
    put_mask  = strikes <= F
    call_mask = strikes >= F

    K_puts = strikes[put_mask];  P = put_prices[put_mask]
    K_calls = strikes[call_mask]; C = call_prices[call_mask]

    def integrate(K, prices):
        if len(K) < 2:
            return 0.0
        integrand = prices / K**2
        return float(np.trapz(integrand, K))

    I = integrate(K_puts, P) + integrate(K_calls, C)

    # Forward-ATM correction
    K0 = F   # approximate K0 as forward
    sigma2 = (2.0 * np.exp(r * T) / T) * I - (1.0 / T) * (F / K0 - 1.0)**2
    return float(np.sqrt(max(sigma2, 0.0)))   # return in vol units

# Implied vol from var swap can be compared to ATM implied vol
# for convexity adjustment analysis.`,
    explanation: "The variance swap strike derived from the log-contract integral is always lower than the ATM implied vol due to Jensen's inequality (vol of vol introduces a convexity premium); this spread — called the vol risk premium — is the key signal for short-vol strategies.",
  },
  {
    id: "pyfin-20260620-b1-implied-dividend",
    language: "python",
    title: "Implied dividend extraction via put-call parity",
    tag: "derivatives",
    code: `import numpy as np
from scipy.optimize import brentq

def implied_dividend(S: float, K: float, r: float, T: float,
                      call_price: float, put_price: float) -> float:
    """
    Put-call parity: C - P = S * exp(-q*T) - K * exp(-r*T)
    Solve for continuous dividend yield q.
    """
    # C - P = F * exp(-r*T) - K * exp(-r*T) where F = S * exp((r-q)*T)
    # => exp(-q*T) = (C - P + K*exp(-r*T)) / S
    rhs = (call_price - put_price + K * np.exp(-r * T)) / S
    if rhs <= 0 or rhs >= 1 + 1e-4:
        return np.nan   # arbitrage-violated quote
    q = -np.log(rhs) / T
    return float(q)

def term_structure_dividends(S: float, r: float,
                              expirations: list[float],
                              atm_calls: list[float],
                              atm_puts: list[float]) -> list[float]:
    """Extract implied dividend yields at each expiration."""
    Ks = [S] * len(expirations)   # ATM strike = spot
    return [implied_dividend(S, K, r, T, C, P)
            for K, T, C, P in zip(Ks, expirations, atm_calls, atm_puts)]`,
    explanation: "Put-call parity is model-free and exact under no-arbitrage; backing out the dividend yield q from quoted ATM call and put prices is how equity derivatives desks calibrate the funding/dividend curve before running any vol model, because an incorrect q shifts every single strike simultaneously.",
  },
  {
    id: "pyfin-20260620-b1-bond-futures-ctd",
    language: "python",
    title: "Bond futures cheapest-to-deliver (CTD) selection",
    tag: "fixed-income",
    code: `import numpy as np
from dataclasses import dataclass

@dataclass
class Bond:
    name: str
    coupon: float          # annual coupon rate
    maturity: float        # years to maturity
    price: float           # clean market price (per 100 face)
    conversion_factor: float  # exchange-published CF

def bond_pv(coupon, maturity, ytm, face=100.0, freq=2):
    """Full price of bond at given YTM."""
    n = int(maturity * freq)
    c = coupon / freq * face
    times = np.arange(1, n + 1) / freq
    disc  = np.exp(-ytm * times)   # continuous discounting
    return float((c * disc).sum() + face * disc[-1])

def futures_invoice_price(futures_price: float, cf: float) -> float:
    """Invoice price = futures price * CF (ignoring accrued)."""
    return futures_price * cf

def select_ctd(bonds: list[Bond], futures_price: float,
               carry_rate: float, delivery_days: float) -> Bond:
    """
    CTD minimises (clean price - invoice price) / CF.
    Equivalently: maximise implied repo rate.
    """
    results = []
    for b in bonds:
        invoice = futures_invoice_price(futures_price, b.conversion_factor)
        # Implied repo: (invoice - dirty_price) / dirty_price * (365/delivery_days)
        # Approximate: ignore accrued interest
        impl_repo = (invoice - b.price) / b.price * (365.0 / max(delivery_days, 1))
        results.append((impl_repo, b))
    # CTD = highest implied repo (cheapest to acquire and deliver)
    results.sort(key=lambda x: x[0], reverse=True)
    return results[0][1]`,
    explanation: "The CTD bond maximises the seller's implied repo rate — the return from buying the bond in the cash market and delivering it against the futures contract; when the yield curve is positively sloped the CTD shifts to lower-coupon, longer-duration bonds as futures price rises.",
  },
  {
    id: "pyfin-20260620-b1-quanto-mc",
    language: "python",
    title: "Quanto option Monte Carlo (FX-adjusted payoff)",
    tag: "derivatives",
    code: `import numpy as np

def quanto_call_mc(S0: float, K: float, r_d: float, r_f: float,
                   sigma_S: float, sigma_X: float, rho: float,
                   T: float, n_paths: int = 100_000, seed: int = 42) -> float:
    """
    Quanto call: payoff in domestic currency = fixed FX rate * max(S_T - K, 0)
    Drift adjustment: S drifts at r_d - sigma_S * sigma_X * rho under Q_d.
    sigma_S: foreign asset vol; sigma_X: FX vol; rho: correlation(S, FX)
    """
    rng = np.random.default_rng(seed)
    # Quanto drift: r_f - rho * sigma_S * sigma_X (risk-neutral measure of domestic)
    mu_Q = r_f - rho * sigma_S * sigma_X

    Z = rng.standard_normal(n_paths)
    ST = S0 * np.exp((mu_Q - 0.5 * sigma_S**2) * T + sigma_S * np.sqrt(T) * Z)
    payoff = np.maximum(ST - K, 0.0)
    return float(np.exp(-r_d * T) * payoff.mean())`,
    explanation: "The quanto adjustment (−ρ·σ_S·σ_X) modifies the risk-neutral drift of the foreign asset to account for the correlation between the asset and the FX rate; a positive correlation makes the domestic investor's expected payoff larger, which is reflected in a higher quanto price than a plain vanilla foreign-currency call.",
  },
  {
    id: "pyfin-20260620-b1-realized-variance",
    language: "python",
    title: "Realised variance and bipower variation from tick data",
    tag: "risk",
    code: `import numpy as np
import pandas as pd

def realized_measures(prices: pd.Series, freq: str = '5min') -> dict:
    """
    Compute realised variance (RV) and bipower variation (BPV) from tick prices.
    Resample to freq to remove microstructure noise (Barndorff-Nielsen & Shephard).
    """
    # Resample to regular grid (last tick)
    p_grid = prices.resample(freq).last().dropna()
    log_ret = np.log(p_grid).diff().dropna().values

    n = len(log_ret)
    # Realised variance: sum of squared returns
    rv = float((log_ret**2).sum())

    # Bipower variation: (pi/2) * sum(|r_i| * |r_{i+1}|)
    # BPV is robust to finite jump activity (jumps contribute 0 to BPV asymptotically)
    bpv = float((np.pi / 2) * (np.abs(log_ret[:-1]) * np.abs(log_ret[1:])).sum())

    # Jump component = max(RV - BPV, 0)
    jump_var = max(rv - bpv, 0.0)
    cont_var = rv - jump_var

    # Annualise (assuming 252 trading days, 6.5 trading hours, freq in minutes)
    minutes_per_day = 6.5 * 60
    n_per_day = minutes_per_day / pd.Timedelta(freq).total_seconds() * 60
    ann_factor = 252 * n_per_day / n

    return {
        'rv': rv,
        'bpv': bpv,
        'jump_var': jump_var,
        'cont_var': cont_var,
        'rv_annual': rv * 252,          # simple annualisation
        'rv_vol': np.sqrt(rv * ann_factor),
    }`,
    explanation: "Bipower variation is robust to price jumps because the product |r_i|·|r_{i+1}| converges to the continuous quadratic variation even when isolated returns are arbitrarily large; subtracting BPV from RV isolates the jump variance, which matters for Heston-style calibrations that separate diffusion from jump risk.",
  },
  {
    id: "pyfin-20260620-b1-dv01-ladder",
    language: "python",
    title: "DV01 bucket ladder for fixed income portfolio",
    tag: "fixed-income",
    code: `import numpy as np
from dataclasses import dataclass, field

BUCKET_TENORS = [0.25, 0.5, 1, 2, 3, 5, 7, 10, 15, 20, 30]

@dataclass
class BondPosition:
    notional: float        # face value
    coupon: float          # annual rate
    maturity: float        # years
    ytm: float             # yield to maturity (continuous)

def bond_dv01(pos: BondPosition) -> dict[float, float]:
    """
    Distribute a bond's total DV01 across standard tenor buckets
    proportional to cash-flow PV weights.
    """
    freq = 2
    n = max(1, int(pos.maturity * freq))
    times = np.array([i / freq for i in range(1, n + 1)])
    coupon_cf = pos.coupon / freq * pos.notional
    cfs = np.full(n, coupon_cf)
    cfs[-1] += pos.notional        # principal at maturity

    pvs = cfs * np.exp(-pos.ytm * times)
    total_pv = pvs.sum()
    # DV01 = -dP/dy / 10000 ≈ duration * PV / 10000
    total_dv01 = (pvs * times).sum() / 10000.0   # in per-basis-point

    # Distribute to nearest bucket
    ladder = {t: 0.0 for t in BUCKET_TENORS}
    for cf_t, pv in zip(times, pvs):
        weight = pv / total_pv
        # Find nearest bucket tenor
        nearest = min(BUCKET_TENORS, key=lambda b: abs(b - cf_t))
        ladder[nearest] += weight * total_dv01
    return ladder

def portfolio_dv01_ladder(positions: list[BondPosition]) -> dict[float, float]:
    ladder = {t: 0.0 for t in BUCKET_TENORS}
    for pos in positions:
        for t, dv in bond_dv01(pos).items():
            ladder[t] += dv
    return ladder`,
    explanation: "Distributing DV01 across standard bucket tenors lets traders hedge specific parts of the yield curve with on-the-run treasuries at those maturities; the PV-weighted bucketing is more accurate than duration-only approaches when the yield curve is steeply sloped.",
  },
  {
    id: "pyfin-20260620-b1-shifted-black-caplet",
    language: "python",
    title: "SOFR caplet pricing with shifted Black (displacement model)",
    tag: "fixed-income",
    code: `import numpy as np
from scipy.stats import norm

def shifted_black_caplet(F: float, K: float, sigma: float,
                          T: float, tau: float, df: float,
                          shift: float = 0.03) -> float:
    """
    Shifted Black (Bachelier with lognormal displacement) for caplet on SOFR.
    F: forward SOFR rate; K: cap strike; shift: displacement (e.g. 3% for negative rates)
    tau: accrual period; df: discount factor to payment date.
    """
    Fd = F + shift
    Kd = K + shift
    if Fd <= 0 or Kd <= 0:
        return max((F - K) * tau * df, 0.0)   # intrinsic only

    d1 = (np.log(Fd / Kd) + 0.5 * sigma**2 * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    return df * tau * (Fd * norm.cdf(d1) - Kd * norm.cdf(d2))

def cap_price(F_fwds: list[float], K: float, sigma: float,
              accrual_start: list[float], accrual_end: list[float],
              discount_factors: list[float], shift: float = 0.03) -> float:
    """Cap = sum of caplets."""
    total = 0.0
    for F, ts, te, df in zip(F_fwds, accrual_start, accrual_end, discount_factors):
        tau = te - ts
        T   = ts   # reset date = start of accrual period
        total += shifted_black_caplet(F, K, sigma, T, tau, df, shift)
    return total`,
    explanation: "The displaced (shifted) Black model adds a constant to both forward and strike before applying lognormal dynamics, allowing calibration to negative rates while preserving the analytic Black formula — the shift parameter is calibrated to the lowest traded strike in the market.",
  },
  {
    id: "pyfin-20260620-b1-xsec-momentum",
    language: "python",
    title: "Rolling cross-sectional momentum signal with vol scaling",
    tag: "factor",
    code: `import numpy as np
import pandas as pd

def xsec_momentum(prices: pd.DataFrame,
                  lookback: int = 252,
                  skip: int = 21,
                  vol_window: int = 63,
                  target_vol: float = 0.10) -> pd.DataFrame:
    """
    Cross-sectional momentum: rank assets by past (lookback - skip) return,
    go long top quintile, short bottom quintile, vol-scaled.
    prices: DataFrame of daily prices (rows=dates, cols=assets)
    """
    log_ret = np.log(prices).diff()

    # Signal: (lookback)–(skip) day return, excluding the most recent month
    signal = (np.log(prices.shift(skip)) - np.log(prices.shift(lookback)))

    # Realised vol for position sizing
    roll_vol = log_ret.rolling(vol_window).std() * np.sqrt(252)

    # Rank-based signals within each date
    ranks = signal.rank(axis=1, pct=True)   # 0..1 cross-sectional percentile

    # Long top 20%, short bottom 20%, zero middle
    raw_pos = np.where(ranks > 0.8, 1.0, np.where(ranks < 0.2, -1.0, 0.0))
    raw_pos_df = pd.DataFrame(raw_pos, index=prices.index, columns=prices.columns)

    # Vol-scale each position
    pos = raw_pos_df.div(roll_vol).mul(target_vol / np.sqrt(252))

    # Neutralise: subtract cross-sectional mean to be market-neutral
    pos = pos.sub(pos.mean(axis=1), axis=0)
    return pos`,
    explanation: "Skipping the most recent month (the skip parameter) avoids short-term reversal contaminating the momentum signal; vol-scaling by realised volatility equalises the ex-ante risk contribution across assets so the portfolio is not accidentally concentrated in high-vol names.",
  },
  {
    id: "pyfin-20260620-b1-max-drawdown-recovery",
    language: "python",
    title: "Maximum drawdown and recovery time analysis",
    tag: "risk",
    code: `import numpy as np
import pandas as pd
from dataclasses import dataclass

@dataclass
class DrawdownStats:
    max_drawdown: float          # worst peak-to-trough drop
    max_dd_start: object         # date of peak
    max_dd_trough: object        # date of trough
    recovery_date: object        # date when NAV recovered (or None)
    recovery_days: float         # calendar days to recover (or inf)
    avg_drawdown: float          # average drawdown depth
    num_drawdowns: int           # count of distinct drawdowns

def drawdown_analysis(nav: pd.Series, threshold: float = -0.01) -> DrawdownStats:
    """nav: daily NAV series (indexed by date)."""
    cum_max = nav.cummax()
    dd = (nav - cum_max) / cum_max   # percentage drawdown (negative)

    # Find the worst trough
    trough_idx = dd.idxmin()
    max_dd = float(dd[trough_idx])
    peak_idx = cum_max[:trough_idx].idxmax()

    # Recovery: first date after trough where NAV >= peak
    post_trough = nav[trough_idx:]
    peak_val = float(nav[peak_idx])
    recovered = post_trough[post_trough >= peak_val]
    rec_date = recovered.index[0] if len(recovered) > 0 else None
    rec_days = (rec_date - trough_idx).days if rec_date else float('inf')

    # Count distinct drawdowns below threshold
    in_dd = dd < threshold
    transitions = in_dd.astype(int).diff().fillna(0)
    n_dd = int((transitions == 1).sum())
    avg_dd = float(dd[dd < threshold].mean()) if (dd < threshold).any() else 0.0

    return DrawdownStats(
        max_drawdown=max_dd, max_dd_start=peak_idx,
        max_dd_trough=trough_idx, recovery_date=rec_date,
        recovery_days=rec_days, avg_drawdown=avg_dd, num_drawdowns=n_dd,
    )`,
    explanation: "Recovery time is often more informative than drawdown depth for assessing strategy viability — a 15% drawdown that recovers in 30 days is acceptable for many allocators, while a 10% drawdown lasting 3 years triggers redemptions; tracking both metrics is essential for capacity analysis.",
  },
  {
    id: "pyfin-20260620-b1-multi-curve-ois-disc",
    language: "python",
    title: "Multi-curve OIS discounting for swap valuation",
    tag: "fixed-income",
    code: `import numpy as np

def ois_discounted_swap_pv(
        fixed_rate: float,
        notional: float,
        payment_dates: np.ndarray,    # years from now
        fwd_rates: np.ndarray,        # floating forward rates per period
        ois_dfs: np.ndarray,          # OIS discount factors at payment dates
        accrual_fracs: np.ndarray,    # day-count fractions per period
        pay_fixed: bool = True,
) -> float:
    """
    Dual-curve pricing: floating leg forecast uses SOFR forward curve,
    both legs discounted with OIS curve (CSA collateral posting).
    """
    # Fixed leg PV
    fixed_pv = notional * fixed_rate * (ois_dfs * accrual_fracs).sum()

    # Floating leg PV: each period's expected cash flow discounted at OIS
    float_pv = notional * (fwd_rates * accrual_fracs * ois_dfs).sum()

    # Par swap: fixed_rate that makes PV = 0
    # par_rate = float_pv / (notional * (ois_dfs * accrual_fracs).sum())

    if pay_fixed:
        return float_pv - fixed_pv   # receiver = negative for pay-fixed
    else:
        return fixed_pv - float_pv

def par_swap_rate(fwd_rates: np.ndarray, ois_dfs: np.ndarray,
                  accrual_fracs: np.ndarray) -> float:
    """Fixed rate that makes swap PV = 0."""
    annuity = (ois_dfs * accrual_fracs).sum()
    return float((fwd_rates * accrual_fracs * ois_dfs).sum() / annuity)`,
    explanation: "Post-2008 swap pricing uses two separate curves: SOFR/LIBOR forwards for estimating floating cash flows and the OIS curve for discounting under CSA agreements — the single-curve assumption undervalues the funding benefit when the LIBOR-OIS spread widens during credit stress.",
  },
  {
    id: "pyfin-20260620-b1-rough-vol-approx",
    language: "python",
    title: "Rough volatility (rBergomi) forward variance simulation",
    tag: "derivatives",
    code: `import numpy as np

def rbegomi_variance_path(xi0: float, H: float, eta: float,
                           T: float, n_steps: int = 252, seed: int = 42) -> np.ndarray:
    """
    Rough Bergomi (Bayer-Friz-Gatheral) forward variance:
    v(t) = xi0 * exp(eta * W^H(t) - 0.5 * eta^2 * t^(2H))
    W^H: fractional Brownian motion with Hurst H ~ 0.1 for equities.
    Uses Euler discretisation of the Volterra kernel (Cholesky on covariance).
    """
    rng = np.random.default_rng(seed)
    dt = T / n_steps
    t  = np.linspace(dt, T, n_steps)

    # Covariance of fBm: Cov(W^H(s), W^H(t)) = 0.5*(s^(2H) + t^(2H) - |t-s|^(2H))
    i_idx, j_idx = np.meshgrid(t, t)
    cov = 0.5 * (np.abs(i_idx)**(2*H) + np.abs(j_idx)**(2*H)
                 - np.abs(i_idx - j_idx)**(2*H))

    # Cholesky + sample
    L   = np.linalg.cholesky(cov + 1e-10 * np.eye(n_steps))
    Z   = rng.standard_normal(n_steps)
    W_H = L @ Z   # fBm sample

    # Forward variance
    v = xi0 * np.exp(eta * W_H - 0.5 * eta**2 * t**(2*H))
    return v   # (n_steps,) instantaneous variance path`,
    explanation: "Rough volatility with Hurst H ≈ 0.1 generates volatility paths with short-memory increments that match the observed power-law decay of the vol-of-vol autocorrelation function; the Cholesky approach is exact but O(n²) — Hybrid schemes exploit the kernel structure for O(n log n) performance.",
  },
];
