import type { Snippet } from "./types";

export const pythonFinanceSnippets20260802B1: Snippet[] = [
  {
    id: "pyfin-20260802-b1-svensson-yield",
    language: "python",
    title: "Svensson Yield Curve Fitting (Extended Nelson-Siegel)",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def svensson_yield(tau: np.ndarray, b0: float, b1: float, b2: float,
                   b3: float, lam1: float, lam2: float) -> np.ndarray:
    """Svensson (1994) extended NS: adds a second hump factor."""
    if lam1 <= 0 or lam2 <= 0:
        return np.full_like(tau, np.nan)
    x1 = tau / lam1
    x2 = tau / lam2
    f1 = (1 - np.exp(-x1)) / x1
    g1 = f1 - np.exp(-x1)
    f2 = (1 - np.exp(-x2)) / x2
    g2 = f2 - np.exp(-x2)
    return b0 + b1 * f1 + b2 * g1 + b3 * g2

def fit_svensson(maturities: np.ndarray, yields: np.ndarray) -> np.ndarray:
    """Fit 6-parameter Svensson model to observed zero rates."""
    def loss(p):
        fitted = svensson_yield(maturities, *p)
        if np.any(np.isnan(fitted)):
            return 1e10
        return np.sum((fitted - yields) ** 2)

    # Initial guess: NS-like start
    x0 = [yields[-1], yields[0] - yields[-1], 0.1, 0.1, 1.5, 5.0]
    bounds = [(None, None)] * 4 + [(0.01, 20), (0.01, 20)]
    res = minimize(loss, x0, method="L-BFGS-B", bounds=bounds,
                   options={"maxiter": 5000, "ftol": 1e-12})
    return res.x

if __name__ == "__main__":
    mats = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30])
    ylds = np.array([0.040, 0.042, 0.044, 0.046, 0.047, 0.048, 0.049, 0.047, 0.044, 0.042])
    params = fit_svensson(mats, ylds)
    print(f"Svensson: b0={params[0]:.4f} b1={params[1]:.4f} "
          f"lam1={params[4]:.3f} lam2={params[5]:.3f}")`,
    explanation: "Svensson adds a second hump term (beta3, lambda2) to Nelson-Siegel, allowing the curve to capture double-humped shapes common in central-bank-distorted yield environments. The ECB publishes Svensson parameters daily; L-BFGS-B handles the positivity constraint on the two lambda parameters."
  },
  {
    id: "pyfin-20260802-b1-cva-irs",
    language: "python",
    title: "CVA for an Interest Rate Swap via Monte Carlo",
    tag: "finance",
    code: `import numpy as np

def cva_irs_mc(notional: float, fixed_rate: float, maturity: float,
               r0: float, kappa: float, theta: float, sigma: float,
               pd_hazard: float, recovery: float,
               n_steps: int = 100, n_paths: int = 10_000,
               seed: int = 42) -> float:
    """
    CVA (Credit Valuation Adjustment) for a payer IRS under Hull-White rates.
    CVA = (1 - R) * sum_t E[max(MtM_t, 0) * PD(t)] * DF(t)
    Uses Hull-White short-rate MC for MtM and constant hazard rate for PD.
    """
    rng  = np.random.default_rng(seed)
    dt   = maturity / n_steps
    sqdt = np.sqrt(dt)

    # Simulate short rates under H-W: dr = kappa*(theta-r)*dt + sigma*dW
    r = np.full(n_paths, r0)
    cva_sum = 0.0

    for step in range(1, n_steps + 1):
        t    = step * dt
        dW   = rng.standard_normal(n_paths) * sqdt
        r   += kappa * (theta - r) * dt + sigma * dW

        # Approximate swap MtM: PV01 * (fixed_rate - current_rate)
        # PV01 ≈ maturity - t for a flat curve (simplified)
        remaining = maturity - t
        if remaining < 1e-6:
            break
        mtm = notional * remaining * (r - fixed_rate)  # positive if rates rose

        # Expected Positive Exposure (EPE)
        epe = np.maximum(mtm, 0).mean()

        # Default probability in this time bucket
        pd_slice = np.exp(-pd_hazard * (t - dt)) - np.exp(-pd_hazard * t)

        # Discount factor at this time
        df = np.exp(-r0 * t)   # simplified: use initial short rate
        cva_sum += (1 - recovery) * epe * pd_slice * df

    return cva_sum

if __name__ == "__main__":
    cva = cva_irs_mc(1_000_000, 0.04, 5.0, 0.03, 0.1, 0.04, 0.01, 0.01, 0.4)
    print(f"CVA: \${cva:,.2f}")`,
    explanation: "CVA is the market value of counterparty credit risk: the present value of expected losses from counterparty default conditional on the position being in-the-money. Decomposing into EPE * PD * (1-R) * DF makes the three risk drivers (exposure, credit, recovery) explicit for hedging with CDS overlays."
  },
  {
    id: "pyfin-20260802-b1-basket-option-mc",
    language: "python",
    title: "Correlated Basket Option MC Pricing (Cholesky Decomposition)",
    tag: "finance",
    code: `import numpy as np

def basket_call_mc(S0: np.ndarray, K: float, T: float, r: float,
                   sigma: np.ndarray, rho_matrix: np.ndarray,
                   weights: np.ndarray,
                   n_steps: int = 252, n_paths: int = 50_000,
                   seed: int = 42) -> float:
    """
    Price a basket call option on a weighted sum of assets.
    Payoff = max(sum(w_i * S_i(T)) - K, 0)
    rho_matrix: (n, n) correlation matrix.
    """
    rng  = np.random.default_rng(seed)
    n    = len(S0)
    dt   = T / n_steps
    L    = np.linalg.cholesky(rho_matrix)   # rho = L @ L^T

    # Pre-compute drift and vol scaling
    drift = (r - 0.5 * sigma ** 2) * dt
    vol   = sigma * np.sqrt(dt)

    logS = np.log(S0)[np.newaxis, :]  # (1, n)
    logS = np.tile(logS, (n_paths, 1))  # (n_paths, n)

    for _ in range(n_steps):
        Z = rng.standard_normal((n_paths, n))
        Z_corr = Z @ L.T          # correlated normals: (n_paths, n)
        logS += drift + vol * Z_corr

    S_T  = np.exp(logS)                               # (n_paths, n)
    basket = (S_T * weights[np.newaxis, :]).sum(axis=1)  # (n_paths,)
    payoff = np.maximum(basket - K, 0)
    return np.exp(-r * T) * payoff.mean()

if __name__ == "__main__":
    n   = 3
    S0  = np.array([100.0, 100.0, 100.0])
    sig = np.array([0.20, 0.25, 0.30])
    rho = np.array([[1.0, 0.5, 0.3], [0.5, 1.0, 0.4], [0.3, 0.4, 1.0]])
    w   = np.array([1/3, 1/3, 1/3])
    price = basket_call_mc(S0, 100.0, 1.0, 0.05, sig, rho, w)
    print(f"Basket call: {price:.4f}")`,
    explanation: "Cholesky decomposition converts a correlation matrix into a lower triangular matrix L such that L@L^T = rho. Multiplying independent normals by L^T injects the correct pairwise correlations. Basket options have no closed form under GBM; they appear in equity structured products and FX multi-asset trades."
  },
  {
    id: "pyfin-20260802-b1-variance-swap",
    language: "python",
    title: "Variance Swap Fair Strike via Replication",
    tag: "finance",
    code: `import numpy as np
from scipy.integrate import quad

def variance_swap_strike(S0: float, T: float, r: float,
                          call_iv: callable, put_iv: callable,
                          K_min: float = None, K_max: float = None) -> float:
    """
    Variance swap fair strike K_var via Carr-Madan log-strip replication:
    K_var^2 = (2/T) * [int_0^F (P(K)/K^2) dK + int_F^inf (C(K)/K^2) dK]
    where P, C are undiscounted option prices and F = S0*exp(r*T).

    Here call_iv(K) and put_iv(K) return Black-Scholes implied vols.
    """
    from scipy.stats import norm
    F = S0 * np.exp(r * T)
    if K_min is None: K_min = F * 0.3
    if K_max is None: K_max = F * 3.0

    def bs_price(K, is_call: bool) -> float:
        iv = call_iv(K) if is_call else put_iv(K)
        if iv <= 0: return 0.0
        d1 = (np.log(F / K) + 0.5 * iv**2 * T) / (iv * np.sqrt(T))
        d2 = d1 - iv * np.sqrt(T)
        if is_call:
            return np.exp(-r * T) * (F * norm.cdf(d1) - K * norm.cdf(d2))
        else:
            return np.exp(-r * T) * (K * norm.cdf(-d2) - F * norm.cdf(-d1))

    integrand_put  = lambda K: bs_price(K, False) / (K * K)
    integrand_call = lambda K: bs_price(K, True)  / (K * K)

    I_put,  _ = quad(integrand_put,  K_min, F)
    I_call, _ = quad(integrand_call, F, K_max)

    K_var_sq = (2.0 / T) * (I_put + I_call)
    return np.sqrt(K_var_sq)  # fair vol strike (annualised)

if __name__ == "__main__":
    flat_iv = lambda K: 0.20   # flat 20% smile for demonstration
    K_var = variance_swap_strike(100, 1.0, 0.05, flat_iv, flat_iv)
    print(f"Fair variance swap vol strike: {K_var:.4f}")  # ≈ 0.20`,
    explanation: "The Carr-Madan log-contract replication shows that a variance swap's fair strike equals a weighted integral of all European option prices — making vol tradeable without any model assumption beyond no jumps. Variance swaps underlie vol surface arbitrage, dispersion trades, and the VIX index construction."
  },
  {
    id: "pyfin-20260802-b1-vasicek-calib",
    language: "python",
    title: "Vasicek Model Calibration from Yield Curve Data",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def vasicek_yield(r0: float, kappa: float, theta: float,
                  sigma: float, tau: np.ndarray) -> np.ndarray:
    """
    Vasicek zero-coupon yield: y(0, tau) = A(tau)/tau - B(tau)*r0/tau
    Closed-form affine term structure.
    """
    B = (1 - np.exp(-kappa * tau)) / kappa
    A = np.exp(
        (theta - sigma**2 / (2 * kappa**2)) * (B - tau)
        - sigma**2 * B**2 / (4 * kappa)
    )
    # Price P(0,T) = A * exp(-B * r0); yield = -log(P) / T
    log_price = np.log(A) - B * r0
    return -log_price / tau

def calibrate_vasicek(maturities: np.ndarray, market_yields: np.ndarray,
                       r0: float) -> dict:
    """Fit Vasicek parameters (kappa, theta, sigma) to market zero rates."""
    def loss(params):
        kappa, theta, sigma = params
        if kappa <= 0 or sigma <= 0:
            return 1e10
        fitted = vasicek_yield(r0, kappa, theta, sigma, maturities)
        return np.sum((fitted - market_yields) ** 2)

    res = minimize(loss, [0.3, 0.04, 0.01], method="Nelder-Mead",
                   options={"xatol": 1e-9, "fatol": 1e-12, "maxiter": 10000})
    kappa, theta, sigma = res.x
    return {"kappa": kappa, "theta": theta, "sigma": sigma,
            "long_run_yield": theta - sigma**2 / (2 * kappa**2)}

if __name__ == "__main__":
    mats = np.array([1, 2, 3, 5, 7, 10])
    mkt  = np.array([0.03, 0.032, 0.034, 0.037, 0.039, 0.040])
    params = calibrate_vasicek(mats, mkt, r0=0.028)
    print(params)`,
    explanation: "Vasicek is the simplest affine short-rate model: closed-form bond prices make calibration fast (no MC needed). The long-run yield theta - sigma^2/(2*kappa^2) reflects the Jensen's inequality adjustment from convexity. Unlike Hull-White, Vasicek doesn't fit the initial curve exactly — use it for scenario analysis rather than precise derivatives pricing."
  },
  {
    id: "pyfin-20260802-b1-eg-cointegration",
    language: "python",
    title: "Engle-Granger Cointegration Test for Pairs Trading",
    tag: "finance",
    code: `import numpy as np
from statsmodels.regression.linear_model import OLS
from statsmodels.tsa.stattools import adfuller
import pandas as pd

def engle_granger_test(y: np.ndarray, x: np.ndarray,
                        max_lag: int = 5) -> dict:
    """
    Two-step Engle-Granger cointegration test.
    Step 1: Regress y on x to find cointegrating vector (beta).
    Step 2: ADF test on residuals for stationarity.
    Returns (beta, ADF statistic, p-value, is_cointegrated).
    """
    # Step 1: OLS
    X = np.column_stack([np.ones(len(x)), x])
    model = OLS(y, X).fit()
    alpha, beta = model.params

    # Cointegrating residual (spread)
    residuals = y - alpha - beta * x

    # Step 2: ADF on residuals (no constant — already demeaned)
    adf_result = adfuller(residuals, maxlag=max_lag, autolag="AIC",
                           regression="nc")   # no constant for residuals
    adf_stat, p_value, _, _, crit_values, _ = adf_result

    # Cointegration at 5% significance
    is_coint = p_value < 0.05

    return {
        "alpha": alpha,
        "beta": beta,
        "adf_stat": adf_stat,
        "p_value": p_value,
        "critical_values": crit_values,
        "is_cointegrated": is_coint,
        "spread": residuals,
    }

if __name__ == "__main__":
    rng = np.random.default_rng(42)
    x   = np.cumsum(rng.standard_normal(500))          # I(1) random walk
    y   = 1.5 * x + 0.2 + rng.standard_normal(500)    # cointegrated: spread is I(0)
    result = engle_granger_test(y, x)
    print(f"beta={result['beta']:.3f} p={result['p_value']:.4f} coint={result['is_cointegrated']}")`,
    explanation: "Engle-Granger's two-step method tests cointegration by checking whether the regression residual (the spread) is stationary via ADF. The ADF critical values for cointegration residuals differ from standard ADF critical values because the residual is estimated — use MacKinnon (2010) adjusted p-values from statsmodels for correct inference."
  },
  {
    id: "pyfin-20260802-b1-efficient-frontier-cvxpy",
    language: "python",
    title: "Mean-Variance Efficient Frontier via cvxpy",
    tag: "finance",
    code: `import numpy as np
import cvxpy as cp
from typing import Tuple

def efficient_frontier(mu: np.ndarray, Sigma: np.ndarray,
                        n_points: int = 50) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Compute the mean-variance efficient frontier.
    Returns (target_returns, portfolio_vols, weight_matrix).
    Constraints: long-only, fully invested (weights sum to 1).
    """
    n = len(mu)
    w = cp.Variable(n)

    # Sweep target returns from min-variance to max-return portfolio
    r_min = mu.min()
    r_max = mu.max()
    targets = np.linspace(r_min, r_max, n_points)

    vols    = np.zeros(n_points)
    weights = np.zeros((n_points, n))

    port_return = mu @ w
    port_var    = cp.quad_form(w, Sigma)

    for i, target in enumerate(targets):
        constraints = [
            cp.sum(w) == 1,
            w >= 0,                    # long-only
            port_return >= target,     # target return constraint
        ]
        prob = cp.Problem(cp.Minimize(port_var), constraints)
        prob.solve(solver=cp.SCS, verbose=False)

        if prob.status in ("optimal", "optimal_inaccurate"):
            vols[i]       = np.sqrt(port_var.value)
            weights[i, :] = w.value
        else:
            vols[i]       = np.nan

    return targets, vols, weights

if __name__ == "__main__":
    rng   = np.random.default_rng(0)
    n     = 5
    mu    = rng.uniform(0.05, 0.15, n)
    A     = rng.standard_normal((n, n))
    Sigma = A.T @ A / n + np.eye(n) * 0.01
    rets, vols, _ = efficient_frontier(mu, Sigma)
    print("Frontier vols:", np.round(vols[::10], 4))`,
    explanation: "cvxpy's `quad_form(w, Sigma)` represents w^T Sigma w as a convex quadratic — ECOS/SCS solves it in milliseconds for n<=100. Sweeping the target return constraint traces the upper half of the minimum-variance frontier. Adding a risk budget or CVaR constraint is a one-line change: cvxpy handles both convex and disciplined-convex formulations."
  },
  {
    id: "pyfin-20260802-b1-black-litterman",
    language: "python",
    title: "Black-Litterman Portfolio Construction",
    tag: "finance",
    code: `import numpy as np

def black_litterman(Sigma: np.ndarray, w_mkt: np.ndarray, delta: float,
                     tau: float, P: np.ndarray, Q: np.ndarray,
                     Omega: np.ndarray) -> dict:
    """
    Black-Litterman posterior return estimation.
    Sigma: (n,n) covariance matrix
    w_mkt: market-cap weights (n,)
    delta: risk aversion coefficient
    tau: scaling factor for prior uncertainty (typically 0.025-0.05)
    P: (k,n) pick matrix (k views)
    Q: (k,) view returns
    Omega: (k,k) view uncertainty diagonal matrix
    Returns posterior expected returns and weights.
    """
    # Prior: implied equilibrium returns pi = delta * Sigma * w_mkt
    pi = delta * Sigma @ w_mkt

    # Posterior: combines prior with views
    tSigma     = tau * Sigma
    tSigmaP    = tSigma @ P.T                         # (n, k)
    M          = P @ tSigmaP + Omega                  # (k, k)
    BL_returns = pi + tSigmaP @ np.linalg.solve(M, Q - P @ pi)

    # Posterior covariance
    BL_Sigma   = (1 + tau) * Sigma - tSigmaP @ np.linalg.solve(M, tSigmaP.T)

    # Optimal weights (unconstrained)
    inv_BLSig  = np.linalg.inv(BL_Sigma)
    w_opt      = inv_BLSig @ BL_returns / delta
    w_opt     /= w_opt.sum()   # normalise to sum-to-1

    return {"mu_bl": BL_returns, "Sigma_bl": BL_Sigma, "w_opt": w_opt}

if __name__ == "__main__":
    n = 3
    Sigma = np.array([[0.04, 0.01, 0.005], [0.01, 0.09, 0.02], [0.005, 0.02, 0.0225]])
    w_mkt = np.array([0.5, 0.3, 0.2])
    P = np.array([[1, -1, 0]])     # view: asset 0 outperforms asset 1
    Q = np.array([0.03])           # by 3%
    Omega = np.diag([0.001])
    result = black_litterman(Sigma, w_mkt, 2.5, 0.025, P, Q, Omega)
    print("BL weights:", result["w_opt"].round(3))`,
    explanation: "Black-Litterman solves a fundamental problem in mean-variance optimisation: sample estimates of mu have huge estimation error that translates to extreme weights. By anchoring to equilibrium returns and blending in views with explicit uncertainty (Omega), BL produces stable, intuitive portfolios that react proportionally to the confidence in each view."
  },
  {
    id: "pyfin-20260802-b1-vwap-benchmark",
    language: "python",
    title: "VWAP Execution Quality Benchmark",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def vwap_analysis(trades: pd.DataFrame, market_trades: pd.DataFrame) -> dict:
    """
    Compare execution quality against VWAP benchmark.
    trades: your fills — columns [timestamp, price, qty, side]
    market_trades: all market trades in the same window — [timestamp, price, qty]
    Returns: portfolio VWAP, market VWAP, slippage in bps.
    """
    # Your VWAP
    port_vwap = (trades["price"] * trades["qty"]).sum() / trades["qty"].sum()

    # Market VWAP over the same time window
    t_min = trades["timestamp"].min()
    t_max = trades["timestamp"].max()
    mkt_in_window = market_trades[
        (market_trades["timestamp"] >= t_min) &
        (market_trades["timestamp"] <= t_max)
    ]
    mkt_vwap = ((mkt_in_window["price"] * mkt_in_window["qty"]).sum()
                / mkt_in_window["qty"].sum())

    # Slippage: positive = worse than VWAP (for buys)
    side = trades["side"].iloc[0]   # "buy" or "sell"
    slippage_bps = (port_vwap - mkt_vwap) / mkt_vwap * 10_000
    if side == "sell":
        slippage_bps = -slippage_bps   # flip sign for sells

    # Participation rate
    total_qty    = market_trades["qty"].sum()
    my_qty       = trades["qty"].sum()
    participation = my_qty / total_qty if total_qty > 0 else 0

    return {
        "port_vwap": port_vwap,
        "mkt_vwap":  mkt_vwap,
        "slippage_bps": slippage_bps,
        "participation_rate": participation,
        "IS": (port_vwap - trades["price"].iloc[0]) / trades["price"].iloc[0] * 10_000,
    }`,
    explanation: "VWAP benchmark measures whether your execution was better or worse than the average market price weighted by volume — a zero-information baseline. Implementation Shortfall (IS, the price from decision to execution) is more theoretically rigorous but requires the arrival price, which VWAP sidesteps. Both metrics appear in TCA (Transaction Cost Analysis) reports."
  },
  {
    id: "pyfin-20260802-b1-zscore-pairs",
    language: "python",
    title: "Z-Score Pairs Trading Signal with Rolling Hedge Ratio",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def zscore_pairs_signal(y: pd.Series, x: pd.Series,
                         lookback: int = 60, entry_z: float = 2.0,
                         exit_z: float = 0.5) -> pd.DataFrame:
    """
    Generate trading signals from a rolling z-score of the spread.
    Hedge ratio estimated via rolling OLS.
    Returns DataFrame with spread, z_score, and signal (-1, 0, +1).
    """
    n = len(y)
    spread  = np.zeros(n)
    z_score = np.zeros(n)
    signal  = np.zeros(n)

    for i in range(lookback, n):
        y_w = y.iloc[i - lookback:i].values
        x_w = x.iloc[i - lookback:i].values

        # Rolling OLS: beta = cov(y,x) / var(x)
        x_dm = x_w - x_w.mean()
        y_dm = y_w - y_w.mean()
        denom = (x_dm @ x_dm)
        beta  = (y_dm @ x_dm) / denom if denom > 1e-12 else 1.0
        alpha = y_w.mean() - beta * x_w.mean()

        # Current spread and z-score
        s = y.iloc[i] - (alpha + beta * x.iloc[i])
        spread[i] = s

        spread_window = np.array([
            y.iloc[j] - (y.iloc[i-lookback:j].values.mean()
                         - (y.iloc[i-lookback:j].values.mean()
                            / (x.iloc[i-lookback:j].values.mean() + 1e-12))
                            * x.iloc[i-lookback:j].values.mean()
                         + beta * x.iloc[j])
            for j in range(i - lookback, i)
        ])
        # Simplified: z-score against rolling spread mean and std
        sp_hist = np.array([y.iloc[j] - alpha - beta * x.iloc[j]
                            for j in range(i - lookback, i)])
        mu_s  = sp_hist.mean()
        sig_s = sp_hist.std() + 1e-12
        z_score[i] = (s - mu_s) / sig_s

    # Signals: sell spread when z > entry_z, buy when z < -entry_z
    for i in range(lookback, n):
        if z_score[i] > entry_z:
            signal[i] = -1   # spread too wide: sell y, buy x
        elif z_score[i] < -entry_z:
            signal[i] = 1    # spread too narrow: buy y, sell x
        elif abs(z_score[i]) < exit_z:
            signal[i] = 0    # exit at mean reversion

    return pd.DataFrame({"spread": spread, "z_score": z_score, "signal": signal},
                         index=y.index)`,
    explanation: "Rolling hedge ratio avoids the non-stationarity of a fixed OLS estimate: as relative valuations drift, the cointegrating relationship changes slowly. The z-score normalises spread by its rolling standard deviation, making entry thresholds comparable across different volatility regimes."
  },
  {
    id: "pyfin-20260802-b1-lookback-closed-form",
    language: "python",
    title: "Lookback Option Closed-Form (Goldman-Sosin-Gatto)",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def lookback_call_floating(S0: float, r: float, q: float,
                            sigma: float, T: float) -> float:
    """
    Floating-strike lookback call: payoff = S_T - min(S, 0..T).
    Exact closed-form: Goldman, Sosin, Gatto (1979).
    """
    a1 = (np.log(S0 / S0) + (r - q + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    # For floating-strike at inception, S_min = S0
    d1 = (r - q + 0.5 * sigma**2) * np.sqrt(T) / sigma
    d2 = (r - q - 0.5 * sigma**2) * np.sqrt(T) / sigma

    price = (S0 * np.exp(-q * T) * norm.cdf(d1)
             - S0 * np.exp(-r * T) * norm.cdf(d2)
             + S0 * np.exp(-r * T) * sigma**2 / (2 * (r - q))
               * (np.exp((r - q) * T) * norm.cdf(-d1 + sigma * np.sqrt(T))
                  - np.exp((r - q) * T) * (r - q) / (r - q)
                  - norm.cdf(-d2)))
    # Simplified special case r != q:
    if abs(r - q) > 1e-8:
        coeff = sigma**2 / (2 * (r - q))
        price = (S0 * np.exp(-q * T) * norm.cdf(d1)
                 - S0 * np.exp(-r * T) * norm.cdf(d2)
                 + S0 * coeff * (norm.cdf(-d2 + sigma * np.sqrt(T)) * np.exp(-r * T)
                                  - np.exp(-q * T) * norm.cdf(-d1)))
    else:
        # r = q case: use limiting formula
        price = S0 * np.exp(-r * T) * (norm.cdf(d1) - norm.cdf(d2)
                + sigma * np.sqrt(T) * (norm.pdf(d1) + d1 * norm.cdf(d1)))
    return price

def lookback_put_fixed(S0: float, K: float, r: float, q: float,
                        sigma: float, T: float) -> float:
    """Fixed-strike lookback put: payoff = max(K - min(S), 0)."""
    d1 = (np.log(S0 / K) + (r - q + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    coeff = sigma**2 / (2 * (r - q)) if abs(r - q) > 1e-8 else sigma * np.sqrt(T)
    return (K * np.exp(-r * T) * norm.cdf(-d2)
            - S0 * np.exp(-q * T) * norm.cdf(-d1)
            + S0 * coeff * (np.exp(-q * T) * norm.cdf(d1) - np.exp(-r * T) * norm.cdf(d2)))`,
    explanation: "The Goldman-Sosin-Gatto formula prices lookback options analytically by decomposing the path-dependent minimum/maximum into a series of vanilla option terms. Practitioners use the closed-form as an MC validation benchmark and to back out implied vol from quoted lookback prices in structured product markets."
  },
  {
    id: "pyfin-20260802-b1-sharpe-bootstrap",
    language: "python",
    title: "Bootstrap Confidence Interval for the Sharpe Ratio",
    tag: "finance",
    code: `import numpy as np

def sharpe_bootstrap_ci(returns: np.ndarray, rf: float = 0.0,
                          n_boot: int = 10_000, ci: float = 0.95,
                          seed: int = 42) -> dict:
    """
    Non-parametric bootstrap CI for the annualised Sharpe ratio.
    Handles autocorrelated returns via block bootstrap.
    """
    rng  = np.random.default_rng(seed)
    n    = len(returns)
    er   = returns - rf / 252      # daily excess return

    def sharpe(r: np.ndarray) -> float:
        mu, sig = r.mean(), r.std(ddof=1)
        return mu / sig * np.sqrt(252) if sig > 1e-12 else 0.0

    observed = sharpe(er)

    # Block bootstrap with block size ~ n^(1/3) for autocorrelation
    block_size = max(1, int(n ** (1/3)))
    boot_sharpes = np.empty(n_boot)

    for i in range(n_boot):
        # Draw random starting blocks until we have >= n observations
        blocks = []
        while sum(len(b) for b in blocks) < n:
            start = rng.integers(0, n - block_size + 1)
            blocks.append(er[start:start + block_size])
        resampled = np.concatenate(blocks)[:n]
        boot_sharpes[i] = sharpe(resampled)

    alpha = (1 - ci) / 2
    lo = np.percentile(boot_sharpes, alpha * 100)
    hi = np.percentile(boot_sharpes, (1 - alpha) * 100)

    return {
        "sharpe": observed,
        "ci_lower": lo,
        "ci_upper": hi,
        "bootstrap_se": boot_sharpes.std(),
    }

if __name__ == "__main__":
    rng  = np.random.default_rng(0)
    rets = rng.normal(0.0005, 0.015, 252 * 3)
    ci   = sharpe_bootstrap_ci(rets)
    print(f"Sharpe: {ci['sharpe']:.2f} 95% CI: [{ci['ci_lower']:.2f}, {ci['ci_upper']:.2f}]")`,
    explanation: "IID bootstrap underestimates CI width for strategies with autocorrelated returns (e.g. momentum). Block bootstrap preserves temporal structure: drawing contiguous blocks of length ~n^(1/3) maintains short-range autocorrelation. Lo (2002) derived the analytical asymptotic distribution but the bootstrap is more robust for non-normal returns."
  },
  {
    id: "pyfin-20260802-b1-cds-bootstrap",
    language: "python",
    title: "CDS Hazard Rate Term Structure Bootstrapping",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import brentq

def bootstrap_hazard_rates(cds_spreads_bps: dict, recovery: float = 0.4,
                             r: float = 0.05) -> dict:
    """
    Bootstrap piecewise-constant hazard rates from CDS spread quotes.
    cds_spreads_bps: {maturity_years: spread_bps} e.g. {1: 50, 3: 80, 5: 120}
    Assumes quarterly coupon payments.
    Returns {maturity: cumulative hazard} dict.
    """
    maturities = sorted(cds_spreads_bps.keys())
    hazards    = {}
    prev_h     = 0.0
    prev_t     = 0.0

    for T in maturities:
        spread = cds_spreads_bps[T] / 10_000

        # Build coupon schedule: quarterly
        coupon_dates = np.arange(0.25, T + 1e-9, 0.25)

        # Calibrated previous pillar hazard rates
        prev_hazards = [(t, hazards[t]) for t in sorted(hazards.keys())]

        def survival(t: float, h_T: float) -> float:
            """Piecewise-constant hazard: S(t) = exp(-sum of h_i * dt_i)."""
            s = 0.0
            t_prev = 0.0
            for (t_pillar, h_seg) in prev_hazards:
                if t <= t_pillar:
                    s += h_seg * (t - t_prev)
                    return np.exp(-s)
                s += h_seg * (t_pillar - t_prev)
                t_prev = t_pillar
            s += h_T * (t - t_prev)
            return np.exp(-s)

        def par_spread(h_T: float) -> float:
            """CDS par spread for the current pillar with hazard h_T."""
            pv_prem = sum(
                survival(t, h_T) * np.exp(-r * t) * 0.25
                for t in coupon_dates
            )
            pv_prot = sum(
                (1 - recovery) * (survival(t - 0.25, h_T) - survival(t, h_T))
                * np.exp(-r * t)
                for t in coupon_dates
            )
            return pv_prot / pv_prem if pv_prem > 1e-12 else 0

        h_T = brentq(lambda h: par_spread(h) - spread, 0.0001, 5.0, xtol=1e-10)
        hazards[T] = h_T

    return hazards

if __name__ == "__main__":
    spreads = {1: 50, 3: 80, 5: 120, 7: 150, 10: 180}
    hz = bootstrap_hazard_rates(spreads)
    for t, h in hz.items():
        print(f"{t}yr hazard: {h:.4f} ({(1-np.exp(-h)):.2%} annual PD approx)")`,
    explanation: "CDS bootstrapping extracts a piecewise-constant hazard rate curve consistent with market spreads — the credit analogue of yield curve bootstrapping. Each pillar's hazard rate is solved iteratively holding previous pillars fixed, so calibration errors don't propagate backwards. The resulting hazard curve feeds CVA, CDO, and bond spread decomposition models."
  },
  {
    id: "pyfin-20260802-b1-roll-yield",
    language: "python",
    title: "Futures Roll Yield and Carry Decomposition",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def futures_returns_decomposition(spot: pd.Series, front: pd.Series,
                                   next_contract: pd.Series,
                                   roll_date: pd.Timestamp) -> dict:
    """
    Decompose futures returns into:
    1. Spot return (price appreciation)
    2. Roll yield (from rolling along the term structure)
    3. Collateral yield (assumed = risk-free on margin)
    """
    # Total return: front contract return
    total_return = front.pct_change().dropna()

    # Spot return
    spot_return = spot.pct_change().dropna()

    # Roll yield: captured at roll date
    # Roll yield ≈ (front - next) / front at roll date (annualised by freq)
    if roll_date in front.index and roll_date in next_contract.index:
        f = front[roll_date]
        n = next_contract[roll_date]
        roll_yield_pct = (f - n) / f   # positive in backwardation
    else:
        roll_yield_pct = 0.0

    # Convenience yield estimate (for commodities: basis)
    basis = front - spot   # positive = futures premium (contango)

    # Annualised roll yield assuming 90-day contract
    roll_annualised = roll_yield_pct * (252 / 90)

    return {
        "spot_return_ann": spot_return.mean() * 252,
        "total_return_ann": total_return.mean() * 252,
        "roll_yield_ann": roll_annualised,
        "implied_carry": total_return.mean() * 252 - spot_return.mean() * 252,
        "basis": basis.describe(),
    }`,
    explanation: "The three components of a long futures return — spot appreciation, roll yield, and collateral return — drive very different risk profiles. Roll yield is deterministic if the term structure is stable: positive in backwardated markets (energy, metals in supply squeeze) and negative in normal contango. Carry strategies systematically harvest positive roll yield."
  },
  {
    id: "pyfin-20260802-b1-event-study",
    language: "python",
    title: "Event Study: Cumulative Abnormal Returns (CAR)",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression

def event_study(stock_returns: pd.Series, market_returns: pd.Series,
                event_date: pd.Timestamp, estimation_window: int = 120,
                event_window: int = 10) -> dict:
    """
    Compute cumulative abnormal returns (CAR) around an event (e.g. earnings).
    Estimation window: [-estimation_window-event_window, -event_window-1]
    Event window: [-event_window, +event_window]
    """
    idx = stock_returns.index.get_loc(event_date)

    # Estimation period returns
    est_start = idx - estimation_window - event_window
    est_end   = idx - event_window
    if est_start < 0:
        raise ValueError("Insufficient history for estimation window")

    y_est = stock_returns.iloc[est_start:est_end].values
    X_est = market_returns.iloc[est_start:est_end].values.reshape(-1, 1)

    # Market model: r_i = alpha + beta * r_m + eps
    model = LinearRegression().fit(X_est, y_est)
    alpha, beta = model.intercept_, model.coef_[0]

    # Event window
    ev_start = idx - event_window
    ev_end   = idx + event_window + 1
    y_ev     = stock_returns.iloc[ev_start:ev_end].values
    X_ev     = market_returns.iloc[ev_start:ev_end].values

    # Abnormal returns: actual - predicted
    AR = y_ev - (alpha + beta * X_ev)
    CAR = np.cumsum(AR)
    days = np.arange(-event_window, event_window + 1)

    # t-statistic for CAR over the full event window
    residuals = y_est - (alpha + beta * X_est.ravel())
    sigma_eps  = residuals.std(ddof=2)
    car_std    = sigma_eps * np.sqrt(len(y_ev))
    t_stat     = CAR[-1] / (car_std + 1e-12)

    return {
        "alpha": alpha, "beta": beta,
        "AR": AR, "CAR": CAR, "days": days,
        "CAR_total": CAR[-1],
        "t_stat": t_stat,
    }`,
    explanation: "The market model removes systematic risk from raw returns, isolating the firm-specific effect of the event. CAR sums abnormal returns across the event window; a statistically significant positive CAR around earnings announcements suggests the market underreacted to prior information — the basis of post-earnings-announcement drift (PEAD) strategies."
  },
  {
    id: "pyfin-20260802-b1-newey-west",
    language: "python",
    title: "Newey-West HAC Standard Errors for Factor Regressions",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
import statsmodels.api as sm

def newey_west_regression(y: pd.Series, X: pd.DataFrame,
                           max_lag: int = None) -> dict:
    """
    OLS with Newey-West HAC standard errors.
    Robust to heteroskedasticity AND autocorrelation — essential for
    overlapping return regressions (e.g. monthly returns from daily data).
    """
    X_const = sm.add_constant(X)
    model   = sm.OLS(y, X_const).fit()

    # Newey-West: automatic lag selection if not specified
    if max_lag is None:
        # Andrews (1991) rule: floor(T^(1/3))
        max_lag = int(np.floor(len(y) ** (1/3)))

    # HAC covariance (Newey-West kernel)
    model_nw = model.get_robustcov_results(cov_type="HAC",
                                            maxlags=max_lag,
                                            use_correction=True)

    return {
        "params": model_nw.params,
        "bse_nw": model_nw.bse,         # HAC standard errors
        "tvalues_nw": model_nw.tvalues,
        "pvalues_nw": model_nw.pvalues,
        "r_squared": model.rsquared,
        "max_lag_used": max_lag,
    }

if __name__ == "__main__":
    rng  = np.random.default_rng(42)
    T    = 300
    x1   = rng.standard_normal(T)
    x2   = rng.standard_normal(T)
    eps  = np.convolve(rng.standard_normal(T + 5), [0.3, 0.5, 0.2], "valid")[:T]
    y    = 0.5 + 1.2 * x1 - 0.8 * x2 + eps
    res  = newey_west_regression(pd.Series(y), pd.DataFrame({"x1": x1, "x2": x2}))
    print("NW t-stats:", res["tvalues_nw"].round(2))`,
    explanation: "OLS standard errors assume IID residuals; time-series regressions with overlapping observations (e.g. 12-month returns computed monthly) violate this. Newey-West applies a Bartlett kernel weighting over lags, downweighting distant autocorrelations. The T^(1/3) lag rule balances bias (too few lags) vs. variance (too many lags)."
  },
  {
    id: "pyfin-20260802-b1-historical-var-bootstrap",
    language: "python",
    title: "Historical Simulation VaR with Bootstrap Confidence Band",
    tag: "finance",
    code: `import numpy as np

def historical_var_es(losses: np.ndarray, confidence: float = 0.99,
                        n_boot: int = 5000, seed: int = 42) -> dict:
    """
    Historical simulation VaR and Expected Shortfall with bootstrap CI.
    losses: array of daily P&L losses (positive = loss).
    """
    n   = len(losses)
    rng = np.random.default_rng(seed)

    def hs_var_es(sample: np.ndarray, alpha: float) -> tuple:
        q = np.quantile(sample, alpha)            # VaR
        es = sample[sample >= q].mean()           # ES = average of tail losses
        return q, es

    alpha = confidence
    var_obs, es_obs = hs_var_es(losses, alpha)

    # Bootstrap distribution
    boot_var = np.empty(n_boot)
    boot_es  = np.empty(n_boot)
    for i in range(n_boot):
        sample         = rng.choice(losses, size=n, replace=True)
        boot_var[i], boot_es[i] = hs_var_es(sample, alpha)

    ci_lo, ci_hi = np.percentile(boot_var, [2.5, 97.5])
    es_lo, es_hi = np.percentile(boot_es,  [2.5, 97.5])

    return {
        "VaR": var_obs,
        "ES": es_obs,
        "VaR_CI_95": (ci_lo, ci_hi),
        "ES_CI_95": (es_lo, es_hi),
        "VaR_SE": boot_var.std(),
        "ES_SE": boot_es.std(),
    }

if __name__ == "__main__":
    rng    = np.random.default_rng(0)
    losses = rng.standard_t(df=4, size=1000) * 0.01
    result = historical_var_es(losses, 0.99)
    print(f"99% VaR: {result['VaR']:.4f} CI: {result['VaR_CI_95']}")`,
    explanation: "Historical simulation makes no distribution assumption — critical when tails are fat or returns exhibit jumps. Bootstrap CIs quantify estimation uncertainty: with only 250 trading days, the 99th percentile VaR has a 95% CI spanning roughly 3-5x the point estimate's uncertainty, which should be disclosed in risk reports."
  },
  {
    id: "pyfin-20260802-b1-dcc-garch-sketch",
    language: "python",
    title: "DCC-GARCH Dynamic Correlation Estimation Sketch",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def dcc_garch_2asset(r1: np.ndarray, r2: np.ndarray,
                      a_dcc: float = 0.05, b_dcc: float = 0.93) -> dict:
    """
    Simplified DCC-GARCH(1,1) for 2 assets.
    Step 1: fit GARCH(1,1) to each series; extract standardised residuals.
    Step 2: fit DCC parameters (a, b) to the residual correlation.
    Returns time series of conditional correlations.
    """
    def garch_var(r: np.ndarray, omega: float = None,
                  alpha: float = 0.1, beta: float = 0.85) -> np.ndarray:
        if omega is None:
            omega = r.var() * (1 - alpha - beta)
        T = len(r)
        h = np.empty(T)
        h[0] = r.var()
        for t in range(1, T):
            h[t] = omega + alpha * r[t-1]**2 + beta * h[t-1]
        return h

    h1 = garch_var(r1)
    h2 = garch_var(r2)

    # Standardised residuals
    e1 = r1 / np.sqrt(h1)
    e2 = r2 / np.sqrt(h2)

    T   = len(r1)
    Qbar = np.array([[1.0, np.corrcoef(e1, e2)[0, 1]],
                     [np.corrcoef(e1, e2)[0, 1], 1.0]])

    Q  = Qbar.copy()
    rho = np.empty(T)

    for t in range(T):
        e_t = np.array([e1[t], e2[t]])
        Q   = (1 - a_dcc - b_dcc) * Qbar + a_dcc * np.outer(e_t, e_t) + b_dcc * Q
        # Normalise to correlation matrix
        D   = np.sqrt(np.diag(Q))
        rho[t] = Q[0, 1] / (D[0] * D[1])

    return {
        "rho": rho,
        "h1": h1, "h2": h2,
        "avg_rho": rho.mean(),
        "rho_range": (rho.min(), rho.max()),
    }

if __name__ == "__main__":
    rng = np.random.default_rng(42)
    r1 = rng.standard_normal(500) * 0.01
    r2 = 0.6 * r1 + rng.standard_normal(500) * 0.008
    res = dcc_garch_2asset(r1, r2)
    print(f"DCC avg rho: {res['avg_rho']:.3f} range: {res['rho_range']}")`,
    explanation: "DCC-GARCH captures time-varying correlations that constant-correlation models miss: correlations between equities spike during crises (correlation breakdown) and collapse in tranquil markets. The DCC update is a scalar GARCH on the quasi-correlation matrix Q, ensuring positive definiteness of the dynamic covariance at each step."
  },
  {
    id: "pyfin-20260802-b1-carry-trade",
    language: "python",
    title: "Currency Carry Trade Return Decomposition",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def carry_trade_returns(spot_rates: pd.DataFrame, ir_diff: pd.DataFrame,
                         long_currencies: list, short_currencies: list) -> dict:
    """
    Compute carry trade P&L from interest rate differentials and spot moves.
    spot_rates: (T, n_currencies) DataFrame of USD/CCY spot rates
    ir_diff: (T, n_currencies) DataFrame of interest rate differential vs USD
    Return decomposition: carry component vs FX spot component.
    """
    # Spot returns: dS / S (positive = USD depreciation vs CCY)
    spot_returns = spot_rates.pct_change().dropna()

    carry_pnl  = pd.Series(dtype=float)
    fx_pnl     = pd.Series(dtype=float)
    total_pnl  = pd.Series(dtype=float)

    for t in spot_returns.index:
        # Carry component: interest rate differential earned over the period
        carry  = ir_diff.loc[t, long_currencies].mean() / 252 \
               - ir_diff.loc[t, short_currencies].mean() / 252

        # FX component: spot appreciation of long minus short
        fx = spot_returns.loc[t, long_currencies].mean() \
           - spot_returns.loc[t, short_currencies].mean()

        carry_pnl[t]  = carry
        fx_pnl[t]     = fx
        total_pnl[t]  = carry + fx

    ann_factor = np.sqrt(252)
    return {
        "total_return_ann": total_pnl.mean() * 252,
        "carry_return_ann": carry_pnl.mean() * 252,
        "fx_return_ann":    fx_pnl.mean() * 252,
        "total_sharpe":     total_pnl.mean() / total_pnl.std() * ann_factor,
        "carry_sharpe":     carry_pnl.mean() / carry_pnl.std() * ann_factor,
        "pnl_series": total_pnl,
    }`,
    explanation: "Carry trade total return decomposes into carry (the interest rate differential, deterministic at entry) and FX appreciation (random, mean-reverting under UIP but trending empirically). The carry component has a high Sharpe in calm periods but crashes during risk-off events when high-yield currencies depreciate sharply — the 'carry crash' tail risk."
  },
];
