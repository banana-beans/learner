import type { Snippet } from "./types";

export const pythonFinanceSnippets20260608B1: Snippet[] = [
  {
    id: "pyfin-20260608-b1-gaussian-copula",
    language: "python",
    tag: "finance",
    title: "Gaussian copula portfolio loss — credit CDO tranche pricing",
    code: `import numpy as np
from scipy.stats import norm

def gaussian_copula_loss(
    weights: np.ndarray,    # notional weight per obligor (sums to 1)
    pd: np.ndarray,         # individual default probabilities
    lgd: np.ndarray,        # loss given default (1 - recovery)
    rho: float,             # single systematic factor correlation
    paths: int = 200_000,
    seed: int = 42,
) -> dict:
    """
    Li (2000) one-factor Gaussian copula:
        Z_i = rho*M + sqrt(1-rho^2)*eps_i   (obligor latent variable)
        default if Z_i < Phi^{-1}(PD_i)
    M: common market factor; eps_i: idiosyncratic noise.
    """
    rng  = np.random.default_rng(seed)
    n    = len(weights)
    thresholds = norm.ppf(pd)        # default thresholds in Z-space

    M_draws   = rng.standard_normal(paths)
    eps_draws = rng.standard_normal((paths, n))
    Z = rho * M_draws[:, None] + np.sqrt(1 - rho**2) * eps_draws
    defaults  = Z < thresholds[None, :]          # (paths, n) bool
    losses    = (defaults * lgd[None, :]) @ weights  # (paths,)

    p99 = np.percentile(losses, 99)
    return {
        "EL":      float(losses.mean()),           # expected loss
        "VaR_99":  float(p99),
        "ES_99":   float(losses[losses >= p99].mean()),
        "std":     float(losses.std()),
    }

# Tranche pricing: equity tranche [0%, 3%] absorbs first losses.
# tranche_loss = np.clip(losses - attach, 0, detach - attach)
# tranche_EL = tranche_loss.mean()`,
    explanation:
      "The single-factor model reduces N-dimensional integration to one integral over M (the market factor) with analytic inner sums per path — each obligor defaults independently conditional on M. High rho concentrates loss in bad scenarios (tail fattening), explaining why highly correlated credit pools produce fat-tailed aggregate losses.",
  },
  {
    id: "pyfin-20260608-b1-almgren-chriss",
    language: "python",
    tag: "finance",
    title: "Almgren-Chriss optimal TWAP execution trajectory",
    code: `import numpy as np

def almgren_chriss_trajectory(
    X0: float,          # shares to liquidate
    T: float,           # liquidation horizon (days)
    N: int,             # number of trading intervals
    sigma: float,       # daily vol of the asset
    eta: float,         # temporary impact coefficient
    gamma_perm: float,  # permanent impact coefficient
    lam: float,         # risk-aversion parameter (lambda)
) -> dict:
    """
    Almgren-Chriss (2001) optimal liquidation under temporary + permanent impact.
    Closed-form trajectory: x_k = X0 * sinh(kappa*(T - t_k)) / sinh(kappa*T)
    where kappa = sqrt(lam*sigma^2 / eta).
    """
    dt   = T / N
    t    = np.linspace(0, T, N + 1)

    kappa = np.sqrt(lam * sigma**2 / eta)
    # Remaining inventory at each time step
    x     = X0 * np.sinh(kappa * (T - t)) / np.sinh(kappa * T)
    x[-1] = 0.0   # fully liquidated at T

    # Trading rates: n_k = (x_{k-1} - x_k) per interval
    trades = np.diff(-x)    # shares sold in each interval (positive)

    # Expected cost = permanent impact + temporary impact
    E_cost = 0.5 * gamma_perm * X0**2 \
             + eta * np.sum(trades**2) / dt

    # Variance of execution shortfall
    V_cost = sigma**2 * dt * np.sum(x[1:]**2)

    return {
        "trajectory":    x.tolist(),
        "trades":        trades.tolist(),
        "expected_cost": float(E_cost),
        "cost_variance": float(V_cost),
        "kappa":         float(kappa),
    }

# Aggressive liquidation (large lambda): kappa large, trades front-loaded.
# Patient liquidation (lambda=0): uniform TWAP, minimises market impact.`,
    explanation:
      "The Almgren-Chriss model yields a closed-form optimal strategy because the utility function (E[cost] + lambda*Var[cost]) is quadratic and the impact model is linear — leading to a sinh-shaped trajectory. Higher risk aversion lambda front-loads trades, accepting larger average impact to reduce variance in the shortfall.",
  },
  {
    id: "pyfin-20260608-b1-johansen-coint",
    language: "python",
    tag: "finance",
    title: "Johansen cointegration test — multivariate pairs trading",
    code: `import numpy as np
import pandas as pd
from statsmodels.tsa.vector_ar.vecm import coint_johansen

def johansen_cointegration(prices: pd.DataFrame,
                            det_order: int = 0,
                            k_ar_diff: int = 1) -> dict:
    """
    Johansen test for cointegration rank in a multivariate price system.
    det_order: -1=no constant, 0=constant (typical for prices), 1=trend.
    Returns trace statistics, critical values, and the cointegrating vectors.
    """
    result = coint_johansen(prices.dropna(), det_order, k_ar_diff)

    # Trace statistic: tests H0: rank <= r vs H1: rank > r
    # Reject if trace_stat > cv at chosen significance (0=10%, 1=5%, 2=1%)
    n_series  = prices.shape[1]
    ranks     = list(range(n_series))
    trace_sig = [bool(result.lr1[r] > result.cvt[r, 1])  # 5% level
                 for r in ranks]

    # Cointegrating vectors: columns of evec
    coint_rank = int(np.sum(trace_sig))
    vectors    = result.evec[:, :coint_rank]  # each column is a beta vector

    # Construct spread: prices @ beta for the first cointegrating vector
    if coint_rank > 0:
        beta   = vectors[:, 0]
        spread = (prices.values @ beta)
    else:
        spread = np.zeros(len(prices))

    return {
        "coint_rank":   coint_rank,
        "trace_stats":  result.lr1.tolist(),
        "crit_vals_5pct": result.cvt[:, 1].tolist(),
        "coint_vectors": vectors.tolist(),
        "spread":        spread.tolist(),
    }

# Usage: prices = pd.DataFrame({"XOM": ..., "CVX": ..., "COP": ...})
# coint_rank=1 means one stationary linear combination exists.`,
    explanation:
      "The Johansen test generalises the Engle-Granger two-variable cointegration test to k variables, detecting all r ≤ k-1 cointegrating relationships simultaneously. The trace statistic tests rank ≤ r sequentially from r=0; the cointegrating vectors define the stationary spreads that form the basis of a multi-leg mean-reversion strategy.",
  },
  {
    id: "pyfin-20260608-b1-pca-stat-arb",
    language: "python",
    tag: "finance",
    title: "PCA statistical arbitrage — eigenportfolio residual trading",
    code: `import numpy as np
import pandas as pd
from sklearn.decomposition import PCA

def pca_stat_arb(returns: pd.DataFrame,
                  n_factors: int = 5,
                  z_entry: float = 2.0,
                  z_exit: float = 0.5) -> dict:
    """
    Statistical arbitrage via PCA factor neutralisation.
    Idiosyncratic residuals (unexplained by top k factors) are mean-reverting.
    """
    R    = returns.dropna().values         # T x N matrix
    # Standardise: unit variance per stock
    std  = R.std(axis=0, keepdims=True)
    R_std = R / (std + 1e-9)

    pca = PCA(n_components=n_factors, random_state=42)
    F   = pca.fit_transform(R_std)         # T x k factor scores
    L   = pca.components_.T                # N x k loadings

    # Reconstruct factor-explained returns
    R_hat   = F @ L.T                      # T x N
    residuals = R_std - R_hat              # T x N idiosyncratic component

    # z-score the latest residual for each stock
    resid_mean = residuals.mean(axis=0)
    resid_std  = residuals.std(axis=0) + 1e-9
    z_scores   = (residuals[-1] - resid_mean) / resid_std

    signals = np.zeros(len(returns.columns))
    signals[z_scores < -z_entry]  =  1.0   # buy cheap (residual below mean)
    signals[z_scores >  z_entry]  = -1.0   # sell rich
    signals[np.abs(z_scores) < z_exit] = 0.0  # exit flat positions

    return {
        "z_scores":          dict(zip(returns.columns, z_scores.round(3))),
        "signals":           dict(zip(returns.columns, signals)),
        "explained_var":     pca.explained_variance_ratio_.tolist(),
        "n_long":            int((signals > 0).sum()),
        "n_short":           int((signals < 0).sum()),
    }`,
    explanation:
      "PCA extracts the k systematic risk factors (market, sector, style) that explain most cross-sectional return variance; the residuals are idiosyncratic and tend to mean-revert — forming the basis of statistical arbitrage. Factor-neutralising the portfolio ensures that only idiosyncratic risk is taken, avoiding exposure to broad market moves.",
  },
  {
    id: "pyfin-20260608-b1-hmm-regime",
    language: "python",
    tag: "finance",
    title: "Hidden Markov Model — bull/bear regime detection",
    code: `import numpy as np
import pandas as pd
from hmmlearn import hmm

def fit_hmm_regimes(returns: pd.Series,
                    n_states: int = 2,
                    seed: int = 42) -> dict:
    """
    Gaussian HMM on daily log-returns: latent states model market regimes.
    State with higher mean/lower vol → bull; lower mean/higher vol → bear.
    """
    X = returns.dropna().values.reshape(-1, 1)
    model = hmm.GaussianHMM(
        n_components=n_states, covariance_type="full",
        n_iter=200, random_state=seed, tol=1e-4
    )
    model.fit(X)

    # Viterbi most-likely state sequence
    states = model.predict(X)

    # Label regimes: higher mean = bull market
    means   = model.means_.flatten()
    bull_id = int(np.argmax(means))
    bear_id = int(np.argmin(means))

    regime_labels = np.where(states == bull_id, "bull", "bear")

    # Transition matrix: P(next=j | current=i)
    trans = model.transmat_

    # Stationary distribution: solve pi @ A = pi, sum(pi)=1
    eigvals, eigvecs = np.linalg.eig(trans.T)
    stat = eigvecs[:, np.argmax(eigvals)].real
    stat = stat / stat.sum()

    return {
        "regime_means":   means.tolist(),
        "regime_vols":    np.sqrt(model.covars_.flatten()).tolist(),
        "transition_mat": trans.tolist(),
        "stationary_dist": stat.tolist(),
        "current_regime": regime_labels[-1],
        "bull_fraction":  float((states == bull_id).mean()),
    }`,
    explanation:
      "The HMM treats the current market regime (bull/bear) as a latent variable — observable only through returns — with a Markov transition structure. The Baum-Welch EM algorithm infers both the emission parameters (regime means and vols) and the transition probabilities simultaneously from the return history.",
  },
  {
    id: "pyfin-20260608-b1-cvar-optimization",
    language: "python",
    tag: "finance",
    title: "CVaR portfolio optimization — scenario-based linear programming",
    code: `import numpy as np
from scipy.optimize import linprog

def cvar_min_portfolio(returns: np.ndarray,
                        alpha: float = 0.95,
                        min_weight: float = 0.0) -> dict:
    """
    Rockafellar-Uryasev (2000) CVaR minimization via linear program.
    returns: (T, N) scenario return matrix.
    CVaR_alpha = min_{zeta, u} { zeta + 1/((1-alpha)*T) * sum max(-r_t@w - zeta, 0) }
    Variables: w (N weights), zeta (VaR), u_t (auxiliary T variables).
    """
    T, N = returns.shape
    p    = 1.0 / ((1 - alpha) * T)

    # Variables: [w_0..w_{N-1}, zeta, u_0..u_{T-1}]
    # Minimise: zeta + p * sum(u_t)
    c = np.zeros(N + 1 + T)
    c[N]     = 1.0      # coefficient on zeta
    c[N+1:]  = p        # coefficients on u_t

    # Constraints:
    # 1) u_t >= -r_t @ w - zeta  =>  r_t @ w + zeta + u_t >= 0  (T constraints)
    A_ub, b_ub = [], []
    for t in range(T):
        row = np.zeros(N + 1 + T)
        row[:N]    = -returns[t]  # -r_t @ w
        row[N]     = -1.0         # -zeta
        row[N+1+t] = -1.0         # -u_t
        A_ub.append(row); b_ub.append(0.0)
    # 2) u_t >= 0  =>  -u_t <= 0  (included via bounds)
    # 3) sum(w) = 1, w >= min_weight
    A_eq = np.zeros((1, N + 1 + T)); A_eq[0, :N] = 1.0
    bounds = ([(min_weight, 1.0)] * N) + [(None, None)] + [(0.0, None)] * T

    res = linprog(c, A_ub=A_ub, b_ub=b_ub,
                  A_eq=A_eq, b_eq=[1.0], bounds=bounds, method="highs")
    w = res.x[:N]
    zeta = res.x[N]
    return {"weights": w.tolist(), "VaR": float(zeta),
            "CVaR": float(res.fun), "converged": res.success}`,
    explanation:
      "Rockafellar-Uryasev showed that CVaR minimisation is equivalent to a linear program despite CVaR being a non-linear function of returns — the key insight is introducing the auxiliary variable zeta (the VaR quantile) and converting the max() into linear inequality constraints. This makes CVaR-optimal portfolios tractable even for thousands of assets and scenarios.",
  },
  {
    id: "pyfin-20260608-b1-irs-pricing",
    language: "python",
    tag: "finance",
    title: "Interest rate swap (IRS) present value from swap curve",
    code: `import numpy as np

def irs_pv(notional: float,
           fixed_rate: float,
           floating_spread: float,
           tenor_years: float,
           payment_freq: int,
           discount_factors: np.ndarray,
           forward_rates: np.ndarray,
           dt: float) -> dict:
    """
    Plain-vanilla IRS: receive fixed, pay floating (from payer perspective).
    PV = PV_fixed - PV_floating.
    payment_freq: payments per year (2=semi-annual, 4=quarterly).
    discount_factors, forward_rates: arrays at each payment date.
    """
    n = int(tenor_years * payment_freq)
    assert len(discount_factors) >= n

    D = discount_factors[:n]    # D[i] = discount factor at payment date i+1
    L = forward_rates[:n]       # L[i] = LIBOR/SOFR forward rate at period i

    tau = 1.0 / payment_freq    # year fraction per period

    # Fixed leg: fixed_rate * tau * notional * sum(D_i)
    pv_fixed    = notional * fixed_rate * tau * D.sum()

    # Floating leg: (L_i + spread) * tau * notional * D_i
    pv_floating = notional * tau * np.sum((L + floating_spread) * D)

    # For receiver swap (receive fixed, pay float): PV = pv_fixed - pv_floating
    pv_swap = pv_fixed - pv_floating

    # DV01: 1 bp change in fixed rate
    dv01 = notional * tau * D.sum() * 1e-4

    return {
        "pv_swap":     round(float(pv_swap), 4),
        "pv_fixed":    round(float(pv_fixed), 4),
        "pv_floating": round(float(pv_floating), 4),
        "dv01":        round(float(dv01), 4),
        "annuity":     round(float(tau * D.sum()), 6),
    }
# Par swap rate = pv_floating / annuity = floating PV / sum(tau*D_i).`,
    explanation:
      "The IRS PV decomposes into two legs: the fixed leg is equivalent to a coupon bond and the floating leg replicates a floating-rate note. The par swap rate is the fixed rate that makes PV_swap = 0; quoting 'the 5-year swap rate' means the par rate bootstrapped from the OIS or SOFR curve.",
  },
  {
    id: "pyfin-20260608-b1-bond-analytics",
    language: "python",
    tag: "finance",
    title: "Bond pricing, modified duration, convexity, DV01",
    code: `import numpy as np
from scipy.optimize import brentq

def bond_analytics(face: float, coupon_rate: float, ytm: float,
                   n_periods: int, freq: int = 2) -> dict:
    """
    Fixed-rate bond: semi-annual coupons, bullet maturity.
    ytm: yield to maturity (annual, decimal).
    Returns dirty price, modified duration, convexity, DV01.
    """
    c    = coupon_rate / freq * face  # coupon per period
    y    = ytm / freq                  # yield per period
    t    = np.arange(1, n_periods + 1)
    df   = (1 + y) ** (-t)
    cf   = np.full(n_periods, c)
    cf[-1] += face                     # final period: coupon + par

    price   = float(np.dot(cf, df))

    # Macaulay duration: weighted average time to cash flow (in periods)
    mac_dur = float(np.dot(t * cf, df) / price)
    mod_dur = mac_dur / (1 + y)        # modified duration (in periods)
    mod_dur_annual = mod_dur / freq    # annualised

    # Convexity (annualised)
    convex = float(np.dot(t * (t + 1) * cf, df) /
                   (price * (1 + y)**2 * freq**2))

    dv01 = mod_dur_annual * price * 1e-4   # $ change per 1 bp

    return {
        "dirty_price":    round(price, 4),
        "mac_duration":   round(mac_dur / freq, 4),   # years
        "mod_duration":   round(mod_dur_annual, 4),   # years
        "convexity":      round(convex, 4),
        "dv01":           round(dv01, 4),
        "pv01":           round(dv01, 4),              # same as DV01
    }

def ytm_from_price(price, face, coupon_rate, n_periods, freq=2):
    """Solve for YTM given dirty price via Brentq."""
    def f(y): return bond_analytics(face, coupon_rate, y, n_periods, freq)["dirty_price"] - price
    return brentq(f, 0.0001, 0.50)`,
    explanation:
      "Modified duration approximates the percentage price change for a 1 unit change in yield: dP/P ≈ -ModDur * dy. Convexity is the second-order correction: dP/P ≈ -ModDur*dy + 0.5*Convexity*dy². Long bonds and low-coupon bonds have higher duration and convexity — greater price sensitivity and positive carry when rates are volatile.",
  },
  {
    id: "pyfin-20260608-b1-cir-calibration",
    language: "python",
    tag: "finance",
    title: "CIR model MLE calibration from time series of rates",
    code: `import numpy as np
from scipy.optimize import minimize
from scipy.stats import ncx2

def cir_log_likelihood(params, r: np.ndarray, dt: float) -> float:
    """
    Non-central chi-squared transition density for CIR.
    dr = kappa*(theta-r)*dt + sigma*sqrt(r)*dW
    Transition: r_{t+1} ~ c * chi^2(nu, lambda_nc) where:
      c = sigma^2*(1-e^{-kappa*dt}) / (4*kappa)
      nu = 4*kappa*theta / sigma^2   (degrees of freedom)
      lambda_nc = e^{-kappa*dt} * r_t / c (non-centrality)
    """
    kappa, theta, sigma = params
    if kappa <= 0 or theta <= 0 or sigma <= 0: return 1e10
    if 2 * kappa * theta <= sigma**2: return 1e10  # Feller condition

    c   = sigma**2 * (1 - np.exp(-kappa*dt)) / (4 * kappa)
    nu  = 4 * kappa * theta / sigma**2
    lam = np.exp(-kappa * dt) * r[:-1] / c

    log_lik = np.sum(ncx2.logpdf(r[1:] / c, df=nu, nc=lam) - np.log(c))
    return -log_lik  # negative for minimisation

def fit_cir(rates: np.ndarray, dt: float = 1/252) -> dict:
    """Maximum likelihood calibration of CIR to daily rate observations."""
    x0 = [1.0, rates.mean(), rates.std() * np.sqrt(2 * 1.0 * rates.mean())]
    res = minimize(cir_log_likelihood, x0, args=(rates, dt),
                   method="Nelder-Mead",
                   options={"xatol": 1e-6, "fatol": 1e-8, "maxiter": 5000})
    kappa, theta, sigma = res.x
    return {
        "kappa": round(float(kappa), 4),
        "theta": round(float(theta), 6),
        "sigma": round(float(sigma), 6),
        "half_life_days": round(float(np.log(2) / kappa * 252), 1),
        "feller_ok": bool(2 * kappa * theta > sigma**2),
        "log_lik": round(float(-res.fun), 2),
    }`,
    explanation:
      "CIR's transition density is a scaled non-central chi-squared, enabling exact MLE without discretisation bias. The Feller condition (2κθ > σ²) ensures the process stays strictly positive — if violated, the calibrated model can reach zero, which is unacceptable for interest rates in most applications.",
  },
  {
    id: "pyfin-20260608-b1-variance-swap-vix",
    language: "python",
    tag: "finance",
    title: "VIX-style model-free implied variance — log-strip integration",
    code: `import numpy as np
from scipy.interpolate import interp1d

def vix_style_variance(strikes: np.ndarray,
                        call_prices: np.ndarray,
                        put_prices: np.ndarray,
                        F: float,
                        r: float,
                        T: float) -> dict:
    """
    Britten-Jones & Neuberger (2000) model-free variance:
    sigma^2 = (2/T) * exp(rT) * [sum_K<F w(K)*P(K) + sum_K>=F w(K)*C(K)]
    w(K) = dK / K^2  (trapezoidal approximation).
    """
    mask_put  = strikes <= F
    mask_call = strikes >= F

    # OTM options: puts below F, calls above F
    K_put = strikes[mask_put]; P = put_prices[mask_put]
    K_call = strikes[mask_call]; C = call_prices[mask_call]

    def integrate(K, V):
        if len(K) < 2: return 0.0
        dK = np.diff(K)
        Km = 0.5 * (K[:-1] + K[1:])
        Vm = 0.5 * (V[:-1] + V[1:])
        return float(np.sum(Vm * dK / Km**2))

    integral = integrate(K_put, P) + integrate(K_call, C)
    var  = 2.0 / T * np.exp(r * T) * integral

    # Adjustment for non-zero F: subtract (F/K0 - 1)^2 where K0 = nearest to F
    K0_idx = int(np.argmin(np.abs(strikes - F)))
    K0     = strikes[K0_idx]
    var   -= (F / K0 - 1.0) ** 2 / T

    vix_annualised = np.sqrt(max(var, 0.0)) * 100.0   # in vol percentage

    return {
        "implied_var":   round(float(var), 8),
        "implied_vol":   round(float(np.sqrt(max(var, 0.0))), 6),
        "vix_like":      round(float(vix_annualised), 3),
        "integral":      round(float(integral), 8),
    }`,
    explanation:
      "The model-free variance is independent of any assumed price process (no Black-Scholes required) — it follows directly from a spanning argument using all available strikes. The 1/K² weighting gives higher importance to OTM puts (downside risk) than OTM calls, explaining why the VIX spikes more on market declines than rallies.",
  },
  {
    id: "pyfin-20260608-b1-max-sharpe-portfolio",
    language: "python",
    tag: "finance",
    title: "Maximum Sharpe ratio via scipy — tangency portfolio",
    code: `import numpy as np
from scipy.optimize import minimize

def max_sharpe_portfolio(mu: np.ndarray,
                          Sigma: np.ndarray,
                          rf: float = 0.04,
                          bounds: tuple = (0.0, 1.0)) -> dict:
    """
    Tangency (maximum Sharpe) portfolio: maximise (mu@w - rf) / sqrt(w@Sigma@w).
    Equivalent to minimising -Sharpe, subject to sum(w)=1, w >= 0 (long-only).
    """
    n = len(mu)
    def neg_sharpe(w):
        ret = float(w @ mu) - rf
        vol = float(np.sqrt(w @ Sigma @ w))
        return -ret / vol if vol > 1e-9 else 1e9

    constraints = [{"type": "eq", "fun": lambda w: np.sum(w) - 1.0}]
    bnd = [bounds] * n
    w0  = np.ones(n) / n

    res = minimize(neg_sharpe, w0, method="SLSQP",
                   bounds=bnd, constraints=constraints,
                   options={"ftol": 1e-12, "maxiter": 1000})
    w   = res.x
    ret = float(w @ mu)
    vol = float(np.sqrt(w @ Sigma @ w))
    sr  = (ret - rf) / vol

    return {
        "weights":    w.round(6).tolist(),
        "return":     round(ret, 6),
        "volatility": round(vol, 6),
        "sharpe":     round(sr, 4),
        "success":    res.success,
    }

# Analytical tangency (unconstrained): w_tan = Sigma^{-1} @ (mu - rf)
# Then normalise: w = w_tan / sum(w_tan).
# Long-only constraint requires numerical optimisation.`,
    explanation:
      "The tangency portfolio is the unique portfolio on the efficient frontier that maximises the Sharpe ratio; geometrically it is the point where the capital market line (through the risk-free asset) is tangent to the mean-variance frontier. With a risk-free asset, all investors should hold the tangency portfolio regardless of risk aversion.",
  },
  {
    id: "pyfin-20260608-b1-local-vol-mc",
    language: "python",
    tag: "finance",
    title: "Local volatility Monte Carlo — Dupire surface simulation",
    code: `import numpy as np
from scipy.interpolate import RectBivariateSpline

def local_vol_mc(S0: float, K: float, r: float, T: float,
                 K_grid: np.ndarray, T_grid: np.ndarray,
                 local_vol_surface: np.ndarray,
                 paths: int = 50_000, steps: int = 100,
                 seed: int = 42) -> float:
    """
    Simulate under local vol model: dS = r*S*dt + sigma_loc(S,t)*S*dW.
    local_vol_surface: (len(T_grid), len(K_grid)) precomputed Dupire surface.
    Bivariate spline interpolates sigma_loc(S,t) at each simulation point.
    """
    # Build 2D spline interpolator on (T_grid, log(K_grid)) for stability
    log_K_grid = np.log(K_grid)
    spline = RectBivariateSpline(T_grid, log_K_grid,
                                  local_vol_surface, kx=3, ky=3)

    rng  = np.random.default_rng(seed)
    dt   = T / steps
    S    = np.full(paths, S0, dtype=float)

    for step in range(steps):
        t     = step * dt
        logS  = np.log(np.maximum(S, 1e-8))
        # Clamp to spline domain
        t_clamped = float(np.clip(t, T_grid[0], T_grid[-1]))
        sig_loc   = np.array([
            float(spline(t_clamped, np.clip(ls, log_K_grid[0], log_K_grid[-1])))
            for ls in logS
        ])
        sig_loc = np.maximum(sig_loc, 1e-4)
        Z = rng.standard_normal(paths)
        S *= np.exp((r - 0.5 * sig_loc**2) * dt + sig_loc * np.sqrt(dt) * Z)

    payoff = np.maximum(S - K, 0.0)
    return float(np.exp(-r * T) * payoff.mean())

# Local vol exactly fits all market call prices but produces
# unrealistic forward vol dynamics — constant surface from calibration date.`,
    explanation:
      "Local vol MC uses the Dupire-calibrated surface as a time-and-spot-dependent diffusion coefficient, ensuring exact fit to market option prices. The key pitfall is the bivariate interpolation: linear interpolation produces jagged instantaneous vols that cause non-smooth path generation; splines or SVI-based surfaces are preferred.",
  },
  {
    id: "pyfin-20260608-b1-barrier-mc-py",
    language: "python",
    tag: "finance",
    title: "Down-and-out barrier option MC with Brownian bridge correction",
    code: `import numpy as np

def dao_call_mc(S0: float, K: float, B: float,
                r: float, sigma: float, T: float,
                paths: int = 100_000, steps: int = 252,
                seed: int = 42) -> dict:
    """
    Down-and-out call MC with Brownian bridge knock-in correction.
    The bridge adjusts for undetected barrier crossings between steps.
    """
    if B >= S0: return {"price": 0.0, "error": "already breached"}
    rng  = np.random.default_rng(seed)
    dt   = T / steps
    logS = np.log(S0) + np.cumsum(
        (r - 0.5*sigma**2)*dt + sigma*np.sqrt(dt)*rng.standard_normal((paths, steps)),
        axis=1
    )
    S_paths = np.exp(logS)   # (paths, steps) final prices

    # Exact discrete monitoring: path alive if never hits B
    alive_discrete = (S_paths > B).all(axis=1)  # (paths,)
    payoff_discrete = np.maximum(S_paths[:, -1] - K, 0.0) * alive_discrete

    # Brownian bridge correction: probability of crossing B between consecutive steps
    # P(min(S_i,S_{i+1}) <= B) = exp(-2 * log(S_i/B) * log(S_{i+1}/B) / (sigma^2*dt))
    S_prev = np.concatenate([np.full((paths, 1), S0), S_paths[:, :-1]], axis=1)
    S_next = S_paths
    log_lo  = np.log(np.maximum(S_prev / B, 1e-9))
    log_hi  = np.log(np.maximum(S_next / B, 1e-9))
    crossing_prob = np.exp(-2.0 * log_lo * log_hi / (sigma**2 * dt))
    knock_prob = crossing_prob.prod(axis=1)  # joint non-crossing probability

    payoff_bridge = np.maximum(S_paths[:, -1] - K, 0.0) * knock_prob

    df = np.exp(-r * T)
    return {
        "price_discrete": round(float(df * payoff_discrete.mean()), 6),
        "price_bridge":   round(float(df * payoff_bridge.mean()), 6),
        "stderr":         round(float(df * payoff_bridge.std() / np.sqrt(paths)), 8),
    }`,
    explanation:
      "The Brownian bridge correction treats each time step as a Brownian bridge between its endpoints, computing the probability that the minimum of the bridge exceeds the barrier. Multiplying these per-step probabilities gives the path survival probability, which replaces the 0/1 alive indicator and dramatically reduces the discretisation bias for coarse time grids.",
  },
  {
    id: "pyfin-20260608-b1-pnl-greek-attr",
    language: "python",
    tag: "finance",
    title: "P&L attribution by Greeks — delta, gamma, vega, theta explain",
    code: `import numpy as np
import pandas as pd

def pnl_greek_attribution(
    delta: float, gamma: float, vega: float, theta: float,
    dS: float, d_sigma: float, dt_days: float,
    S: float
) -> dict:
    """
    Taylor expansion of option P&L:
    dV ≈ delta*dS + 0.5*gamma*dS^2 + vega*d_sigma + theta*dt

    delta: option delta (position-size adjusted)
    gamma: option gamma (per $^2 move)
    vega:  option vega (per 1 vol point = 0.01)
    theta: option theta (per calendar day, already negative for long)
    dS:    price change ($)
    d_sigma: implied vol change (decimal, e.g. 0.01 = 1 vol point)
    dt_days: time elapsed in calendar days
    """
    delta_pnl = delta * dS
    gamma_pnl = 0.5 * gamma * dS**2
    vega_pnl  = vega * d_sigma * 100   # vega in $ per 1 vol pt, d_sigma in decimal
    theta_pnl = theta * dt_days

    # Cross terms (second-order) — often ignored in daily attr
    vanna_approx  = gamma * dS * d_sigma * 100  # dV/dS/dsigma * dS * dsigma
    volga_approx  = 0.0   # d^2V/dsigma^2 — need vomma for this

    total_explained = delta_pnl + gamma_pnl + vega_pnl + theta_pnl

    return {
        "delta_pnl":     round(delta_pnl, 4),
        "gamma_pnl":     round(gamma_pnl, 4),
        "vega_pnl":      round(vega_pnl, 4),
        "theta_pnl":     round(theta_pnl, 4),
        "total_greek":   round(total_explained, 4),
    }

# The theta-gamma relationship: for delta-hedged options,
# theta_pnl + gamma_pnl ≈ -r*V*dt  (no P&L if vol = implied vol).
# Realized gamma > implied gamma → gamma_pnl > |theta_pnl| → positive carry.`,
    explanation:
      "Greek P&L attribution decomposes daily option P&L into first-order (delta, vega) and second-order (gamma) components — essential for identifying which risk exposures drove performance. The theta-gamma relationship is fundamental: long options pay theta every day in exchange for the gamma profit when the asset moves far enough.",
  },
  {
    id: "pyfin-20260608-b1-factor-risk-model",
    language: "python",
    tag: "finance",
    title: "Barra-style factor risk model — covariance decomposition",
    code: `import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression

def factor_risk_decomposition(returns: pd.DataFrame,
                               factor_returns: pd.DataFrame) -> dict:
    """
    Barra-style risk model: R = B @ F + u
    B: (N, K) factor exposure matrix (betas)
    F: (T, K) factor return matrix
    u: idiosyncratic returns (T, N) — assumed uncorrelated across assets.
    """
    assets  = returns.columns.tolist()
    factors = factor_returns.columns.tolist()
    aligned = returns.align(factor_returns, axis=0, join="inner")
    R  = aligned[0].values   # T x N
    F  = aligned[1].values   # T x K

    N, K = len(assets), len(factors)
    B = np.zeros((N, K))    # factor exposures (loadings)
    u = np.zeros_like(R)    # idiosyncratic residuals

    reg = LinearRegression(fit_intercept=False)
    for i in range(N):
        reg.fit(F, R[:, i])
        B[i] = reg.coef_
        u[:, i] = R[:, i] - F @ B[i]

    # Factor covariance (K x K)
    F_cov  = np.cov(F.T)
    # Specific (idiosyncratic) variance diagonal (N x N), assumed diagonal
    D      = np.diag(u.var(axis=0))

    # Total covariance: Sigma = B @ F_cov @ B.T + D
    Sigma  = B @ F_cov @ B.T + D

    # Factor-explained variance fraction per asset
    factor_var  = np.diag(B @ F_cov @ B.T)
    total_var   = np.diag(Sigma)
    r_squared   = factor_var / np.maximum(total_var, 1e-10)

    return {
        "factor_cov":    F_cov.tolist(),
        "betas":         dict(zip(assets, B.tolist())),
        "r_squared":     dict(zip(assets, r_squared.round(4))),
        "portfolio_vol": float(np.sqrt(np.ones(N)/N @ Sigma @ np.ones(N)/N)),
    }`,
    explanation:
      "Barra risk models separate asset covariance into factor-driven (systematic) and idiosyncratic components; the diagonal assumption for D reduces the number of parameters from N² to N+K² — critical for large universes. Factor-explained R² above 90% indicates the factor set captures most cross-sectional variation.",
  },
  {
    id: "pyfin-20260608-b1-yang-zhang-vol",
    language: "python",
    tag: "finance",
    title: "Yang-Zhang realized volatility estimator — OHLC data",
    code: `import numpy as np
import pandas as pd

def yang_zhang_vol(ohlc: pd.DataFrame, window: int = 21,
                   annualise: bool = True) -> pd.Series:
    """
    Yang-Zhang (2000) estimator: minimum variance, handles open gaps.
    sigma_YZ^2 = sigma_OC^2 + k*sigma_CC^2 + (1-k)*sigma_RS^2
    where sigma_RS is the Rogers-Satchell term (drift-free intraday).
    """
    O, H, L, C = (ohlc[col].values for col in ["open", "high", "low", "close"])

    # Overnight return: log(O_t / C_{t-1})
    C_prev = np.roll(C, 1); C_prev[0] = np.nan
    o      = np.log(O / C_prev)          # overnight

    # Open-to-close return: log(C_t / O_t)
    c      = np.log(C / O)               # open-to-close

    # Rogers-Satchell intraday: log(H/C)*log(H/O) + log(L/C)*log(L/O)
    rs     = np.log(H/C)*np.log(H/O) + np.log(L/C)*np.log(L/O)

    n   = window
    k   = 0.34 / (1.34 + (n+1) / (n-1))  # optimal weighting

    # Rolling window variance estimates
    idx = ohlc.index
    var_o  = pd.Series(o**2,  index=idx).rolling(n, min_periods=n).mean()
    var_c  = pd.Series(c**2,  index=idx).rolling(n, min_periods=n).mean()
    var_rs = pd.Series(rs,    index=idx).rolling(n, min_periods=n).mean()

    var_yz = var_o + k * var_c + (1 - k) * var_rs
    vol    = np.sqrt(var_yz)
    if annualise:
        vol = vol * np.sqrt(252)

    return vol

# YZ estimator is 5-8x more efficient than close-to-close for a given window,
# handling both drift and overnight gaps — essential for illiquid markets.`,
    explanation:
      "Yang-Zhang combines the overnight variance (open gap), the open-to-close variance, and the Rogers-Satchell drift-free intraday estimator with an optimal weight k that minimises total variance. It is asymptotically unbiased and handles non-zero drift, making it superior to Parkinson (intraday only) or Garman-Klass for daily bar data.",
  },
  {
    id: "pyfin-20260608-b1-vasicek-term",
    language: "python",
    tag: "finance",
    title: "Vasicek term structure — ZCB prices and forward rates",
    code: `import numpy as np
from scipy.optimize import minimize

def vasicek_zcb(r0: float, kappa: float, theta: float,
                sigma: float, T: float) -> float:
    """Vasicek (1977) zero-coupon bond: P(0,T) = A(T)*exp(-B(T)*r0)."""
    B   = (1 - np.exp(-kappa * T)) / kappa
    lnA = (B - T) * (kappa**2 * theta - 0.5 * sigma**2) / kappa**2 \
          - sigma**2 * B**2 / (4 * kappa)
    return float(np.exp(lnA - B * r0))

def vasicek_term_structure(r0: float, kappa: float, theta: float,
                            sigma: float,
                            maturities: np.ndarray) -> dict:
    """Compute ZCB prices, yields, and instantaneous forward rates."""
    prices = np.array([vasicek_zcb(r0, kappa, theta, sigma, T)
                        for T in maturities])
    yields = -np.log(prices) / maturities   # continuously compounded yields

    # Forward rate: f(0,T) = -d/dT log P(0,T)
    eps    = 1e-5
    fwds   = np.array([
        -(np.log(vasicek_zcb(r0, kappa, theta, sigma, T+eps))
          - np.log(vasicek_zcb(r0, kappa, theta, sigma, T))) / eps
        for T in maturities
    ])
    return {"maturities": maturities.tolist(),
            "zcb_prices": prices.tolist(),
            "yields":     yields.tolist(),
            "fwd_rates":  fwds.tolist()}

def fit_vasicek(observed_yields: np.ndarray, maturities: np.ndarray,
                r0: float) -> dict:
    """Least-squares calibration of kappa, theta, sigma to yield curve."""
    def obj(p):
        kappa, theta, sigma = np.abs(p)
        ts   = vasicek_term_structure(r0, kappa, theta, sigma, maturities)
        return float(np.sum((np.array(ts["yields"]) - observed_yields)**2))
    res = minimize(obj, [1.0, 0.04, 0.01], method="Nelder-Mead")
    return dict(zip(["kappa","theta","sigma"], np.abs(res.x)))`,
    explanation:
      "Vasicek's Ornstein-Uhlenbeck dynamics produce an affine term structure: log ZCB prices are linear in the short rate r, making yield curve calculations analytic. The model allows negative rates (a feature in low-rate environments) but cannot fit an arbitrary initial yield curve — Hull-White extends it by making theta time-varying.",
  },
  {
    id: "pyfin-20260608-b1-credit-migration",
    language: "python",
    tag: "finance",
    title: "Credit migration matrix — Markov chain rating transitions",
    code: `import numpy as np
import pandas as pd

def credit_migration_analysis(annual_matrix: np.ndarray,
                               ratings: list,
                               horizon_years: int = 5) -> dict:
    """
    Markov chain credit migration: P(t) = Q^t where Q is annual transition matrix.
    ratings: list of rating labels (e.g. ['AAA','AA','A','BBB','BB','B','CCC','D']).
    Default = absorbing state (last column).
    """
    Q = np.array(annual_matrix)
    n = Q.shape[0]
    assert Q.shape == (n, n)
    assert np.allclose(Q.sum(axis=1), 1.0, atol=1e-6), "rows must sum to 1"

    # Multi-year transition: matrix power
    Q_t = np.linalg.matrix_power(Q, horizon_years)

    # Default probabilities at horizon: last column (absorbing 'D' state)
    default_probs = Q_t[:, -1]

    # Expected rating distribution starting from each initial rating
    # Stationary distribution (if ergodic): solve pi @ Q = pi
    eigvals, eigvecs = np.linalg.eig(Q.T)
    stat_idx = int(np.argmin(np.abs(eigvals - 1.0)))
    stat = eigvecs[:, stat_idx].real
    stat = np.abs(stat) / np.abs(stat).sum()

    # Expected time in default (mean absorption time) -- approximate via simulation
    # For absorbing Markov chain: N = (I - Q_transient)^{-1} (fundamental matrix)
    Q_t_mat = Q[:-1, :-1]  # remove absorbing default state
    N = np.linalg.inv(np.eye(n-1) - Q_t_mat)  # fundamental matrix
    t_to_default = N.sum(axis=1)  # expected steps (years) to default

    return {
        f"{horizon_years}yr_transitions": pd.DataFrame(
            Q_t, index=ratings, columns=ratings).round(4).to_dict(),
        "default_probs": dict(zip(ratings, default_probs.round(6))),
        "t_to_default_yrs": dict(zip(ratings[:-1], t_to_default.round(2))),
        "stationary_dist": dict(zip(ratings, stat.round(6))),
    }`,
    explanation:
      "Credit migration matrices are empirically estimated from rating agency histories; the Markov assumption simplifies multi-period analysis to matrix exponentiation. The fundamental matrix N = (I - Q_transient)^{-1} computes the expected number of years spent in each transient rating before absorbing into default — used for expected loss calculations in credit risk.",
  },
  {
    id: "pyfin-20260608-b1-min-var-txcost",
    language: "python",
    tag: "finance",
    title: "Minimum variance with transaction costs — cvxpy quadratic program",
    code: `import numpy as np
try:
    import cvxpy as cp
    HAS_CVXPY = True
except ImportError:
    HAS_CVXPY = False

def min_var_with_txcost(Sigma: np.ndarray,
                         w_prev: np.ndarray,
                         tc_bps: float = 10.0,
                         turnover_limit: float = 0.20,
                         long_only: bool = True) -> dict:
    """
    Minimum variance QP with transaction cost penalty and turnover constraint.
    min   w.T @ Sigma @ w  +  tc_bps/10000 * sum(|w - w_prev|)
    s.t.  sum(w) = 1,  w >= 0 (if long_only),  ||w - w_prev||_1 <= turnover_limit
    """
    if not HAS_CVXPY:
        return {"error": "cvxpy not installed"}
    n   = len(w_prev)
    w   = cp.Variable(n)
    dev = cp.Variable(n, nonneg=True)   # |w - w_prev| linearisation

    variance = cp.quad_form(w, Sigma)
    tc_cost  = (tc_bps / 10_000) * cp.sum(dev)

    constraints = [
        cp.sum(w) == 1.0,
        dev >= w - w_prev,
        dev >= w_prev - w,
        cp.sum(dev) <= turnover_limit,
    ]
    if long_only:
        constraints.append(w >= 0)

    prob = cp.Problem(cp.Minimize(variance + tc_cost), constraints)
    prob.solve(solver=cp.CLARABEL, eps_abs=1e-8, eps_rel=1e-8)

    if w.value is None:
        return {"error": "infeasible", "status": prob.status}

    trades   = w.value - w_prev
    turnover = float(np.abs(trades).sum())
    return {
        "weights":   w.value.round(6).tolist(),
        "variance":  round(float(variance.value), 8),
        "turnover":  round(turnover, 4),
        "tc_cost_bps": round(float(tc_cost.value * 10_000), 2),
    }`,
    explanation:
      "Transaction costs are modelled as a linear penalty proportional to absolute trades; the non-smooth L1 term is linearised by introducing the auxiliary variable dev ≥ |w - w_prev|, which converts the problem to a standard QP solvable by interior-point methods. The turnover constraint prevents excessive churn when TC-adjusted variance improvement is marginal.",
  },
  {
    id: "pyfin-20260608-b1-cds-upfront",
    language: "python",
    tag: "finance",
    title: "CDS upfront ↔ running spread conversion (ISDA model)",
    code: `import numpy as np
from scipy.optimize import brentq

def risky_annuity(hazard: float, r: float, T: float,
                  freq: int = 4) -> float:
    """PV01 of the CDS premium leg (survival-weighted annuity)."""
    dt   = 1.0 / freq
    t    = np.arange(dt, T + dt/2, dt)
    Q    = np.exp(-hazard * t)          # survival probability
    D    = np.exp(-r * t)               # risk-free discount
    return float(np.sum(Q * D * dt))

def cds_upfront_to_spread(upfront: float,
                           T: float,
                           r: float,
                           recovery: float = 0.40,
                           coupon_bps: float = 100.0) -> dict:
    """
    Convert CDS upfront price to running (par) spread.
    upfront > 0: protection buyer pays upfront (risky/distressed name).
    upfront < 0: protection buyer receives upfront (investment-grade).
    """
    coupon = coupon_bps / 10_000.0

    def obj(h):
        ann  = risky_annuity(h, r, T)
        dt   = 0.25
        t    = np.arange(dt, T + dt/2, dt)
        Q    = np.exp(-h * t); Q_prev = np.concatenate([[1.0], Q[:-1]])
        D    = np.exp(-r * t)
        prot_pv = (1 - recovery) * float(np.sum(D * (Q_prev - Q)))
        prem_pv = coupon * ann
        # upfront = prot_pv - prem_pv (from protection buyer perspective)
        return prot_pv - prem_pv - upfront

    h_star = brentq(obj, 1e-6, 50.0, xtol=1e-8)
    ann    = risky_annuity(h_star, r, T)
    par_spread_bps = h_star * (1 - recovery) / ann * 10_000.0

    return {
        "hazard_rate":      round(h_star, 6),
        "par_spread_bps":   round(par_spread_bps, 2),
        "risky_annuity":    round(ann, 6),
        "implied_pd_1yr":   round(1 - np.exp(-h_star), 6),
    }`,
    explanation:
      "The ISDA CDS pricing model standardised the relationship between upfront payment and running spread, enabling counterparties to trade at fixed coupons (100 bps for IG, 500 bps for HY) and settle the difference via upfront. Bootstrapping the hazard rate from upfront price is equivalent to stripping the CDS curve from market quotes.",
  },
];
