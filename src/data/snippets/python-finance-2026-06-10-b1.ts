import type { Snippet } from "./types";

export const pythonFinanceSnippets20260610B1: Snippet[] = [
  {
    id: "pyfin-20260610-b1-sabr-calibration",
    language: "python",
    tag: "finance",
    title: "SABR model calibration — Hagan smile formula fitting",
    code: `import numpy as np
from scipy.optimize import minimize

def sabr_vol(F: float, K: float, T: float,
             alpha: float, beta: float, rho: float, nu: float) -> float:
    """
    Hagan et al. (2002) SABR implied vol approximation.
    F = forward, K = strike, T = expiry.
    beta in [0,1]: 0=normal, 0.5=CIR-like, 1=lognormal backbone.
    """
    if abs(F - K) < 1e-10:   # ATM formula
        FK   = F
        term1 = alpha / (FK ** (1 - beta))
        term2 = (1 + ((1-beta)**2/24 * alpha**2 / FK**(2-2*beta)
                      + rho*beta*nu*alpha / (4*FK**(1-beta))
                      + (2-3*rho**2)/24 * nu**2) * T)
        return term1 * term2

    log_FK = np.log(F / K)
    FK_mid = (F * K) ** ((1 - beta) / 2)
    z      = (nu / alpha) * FK_mid * log_FK
    chi    = np.log((np.sqrt(1 - 2*rho*z + z**2) + z - rho) / (1 - rho))
    x_chi  = z / chi if abs(chi) > 1e-12 else 1.0

    A = alpha / (FK_mid * (1 + (1-beta)**2/24 * log_FK**2
                            + (1-beta)**4/1920 * log_FK**4))
    B = (1 + ((1-beta)**2/24 * alpha**2 / (FK_mid**(2))
              + rho*beta*nu*alpha / (4*FK_mid)
              + (2-3*rho**2)/24 * nu**2) * T)
    return A * x_chi * B

def calibrate_sabr(forwards: np.ndarray, strikes: np.ndarray,
                    expiry: float, market_vols: np.ndarray,
                    beta: float = 0.5) -> dict:
    """
    Calibrate alpha, rho, nu (fixing beta) to market implied vols.
    ATM vol constrains alpha; wings constrain rho and nu.
    """
    F = forwards.mean()

    def obj(params):
        alpha, rho, nu = params
        if alpha <= 0 or nu <= 0 or abs(rho) >= 1:
            return 1e10
        model_vols = np.array([sabr_vol(F, K, expiry, alpha, beta, rho, nu)
                                for K in strikes])
        return float(np.sum((model_vols - market_vols) ** 2))

    # Initialise from ATM vol
    atm_idx = np.argmin(np.abs(strikes - F))
    atm_vol = market_vols[atm_idx]
    alpha0  = atm_vol * F ** (1 - beta)

    res = minimize(obj, [alpha0, -0.3, 0.3], method="Nelder-Mead",
                   options={"xatol": 1e-7, "fatol": 1e-9, "maxiter": 5000})
    alpha, rho, nu = res.x

    fitted = np.array([sabr_vol(F, K, expiry, alpha, beta, rho, nu) for K in strikes])
    return {
        "alpha": round(float(alpha), 6), "beta": beta,
        "rho":   round(float(rho),   4), "nu": round(float(nu), 4),
        "rmse":  round(float(np.sqrt(np.mean((fitted - market_vols)**2))), 6),
        "fitted_vols": fitted.tolist(),
    }`,
    explanation:
      "SABR's popularity stems from Hagan's closed-form approximation, which trades a small analytical error (valid for reasonable maturities) for near-instant calibration versus numerically solving the full PDE. The beta parameter is typically fixed by asset class convention: equity uses beta=1 (lognormal backbone), rates use beta=0.5 or 0 to handle negative rate regimes without switching to the Bachelier model.",
  },
  {
    id: "pyfin-20260610-b1-dupire-local-vol",
    language: "python",
    tag: "finance",
    title: "Dupire local vol surface — implied vol to local vol via Breeden-Litzenberger",
    code: `import numpy as np
from scipy.interpolate import RectBivariateSpline
from scipy.ndimage import gaussian_filter

def dupire_local_vol(strikes: np.ndarray,        # 1D array of strikes
                      expiries: np.ndarray,       # 1D array of expiries
                      implied_vols: np.ndarray,   # 2D (len(expiries), len(strikes))
                      S0: float, r: float = 0.0, q: float = 0.0) -> callable:
    """
    Dupire (1994): sigma_loc^2(K,T) = (dC/dT + (r-q)*K*dC/dK + q*C)
                                        / (0.5 * K^2 * d^2C/dK^2)
    where C is the call price surface. Computes local vol by differentiating
    the implied vol surface numerically and converting to call prices first.
    """
    from scipy.stats import norm

    def bs_call(S, K, r, q, sigma, T):
        if T < 1e-6 or sigma < 1e-6:
            return max(S * np.exp(-q*T) - K * np.exp(-r*T), 0.0)
        d1 = (np.log(S/K) + (r - q + 0.5*sigma**2)*T) / (sigma * np.sqrt(T))
        d2 = d1 - sigma * np.sqrt(T)
        return S*np.exp(-q*T)*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

    # Build call price surface
    C_surf = np.zeros((len(expiries), len(strikes)))
    for i, T in enumerate(expiries):
        for j, K in enumerate(strikes):
            C_surf[i, j] = bs_call(S0, K, r, q, implied_vols[i, j], T)

    # Smooth before differentiating (noise amplification in second derivative)
    C_smooth = gaussian_filter(C_surf, sigma=1.0)

    # Spline interpolation for smooth analytical derivatives
    spline = RectBivariateSpline(expiries, strikes, C_smooth, kx=3, ky=3)

    def local_vol(K: float, T: float) -> float:
        """Dupire local volatility at (K, T)."""
        C   = float(spline(T, K))
        dCdT  = float(spline(T, K, dx=1))
        dCdK  = float(spline(T, K, dy=1))
        d2CdK2 = float(spline(T, K, dy=2))

        numerator   = dCdT + (r - q) * K * dCdK + q * C
        denominator = 0.5 * K**2 * d2CdK2

        if denominator < 1e-12:
            return float(implied_vols[np.argmin(np.abs(expiries - T)),
                                       np.argmin(np.abs(strikes - K))])
        var = numerator / denominator
        return float(np.sqrt(max(var, 0.0)))

    return local_vol`,
    explanation:
      "Dupire's equation inverts the option pricing problem: given the entire implied vol surface, it extracts the unique diffusion coefficient (local vol) for a risk-neutral process that reproduces all vanilla option prices simultaneously. The second derivative d²C/dK² is the risk-neutral density (Breeden-Litzenberger), making noise amplification the dominant numerical challenge — Gaussian smoothing is applied before differentiation.",
  },
  {
    id: "pyfin-20260610-b1-mean-variance-cvxpy",
    language: "python",
    tag: "finance",
    title: "Mean-variance frontier with cvxpy — efficient portfolio optimization",
    code: `import numpy as np
import cvxpy as cp

def efficient_frontier(mu: np.ndarray,        # expected returns (N,)
                        Sigma: np.ndarray,     # covariance matrix (N, N)
                        n_points: int = 50,
                        long_only: bool = True,
                        max_weight: float = 0.40) -> dict:
    """
    Compute the efficient frontier by solving min w^T Sigma w
    subject to w^T mu = target, sum(w) = 1, w >= 0 (if long_only).
    Returns frontier portfolios and their risk/return coordinates.
    """
    N = len(mu)
    w = cp.Variable(N)

    constraints = [cp.sum(w) == 1]
    if long_only:
        constraints.append(w >= 0)
    if max_weight < 1.0:
        constraints.append(w <= max_weight)

    mu_range  = np.linspace(mu.min(), mu.max(), n_points)
    vols, rets, weights = [], [], []

    for mu_target in mu_range:
        constraints_local = constraints + [mu @ w == mu_target]
        risk = cp.quad_form(w, Sigma)
        prob = cp.Problem(cp.Minimize(risk), constraints_local)
        prob.solve(solver=cp.SCS, warm_start=True, verbose=False)

        if prob.status in ("optimal", "optimal_inaccurate") and w.value is not None:
            w_opt = np.array(w.value)
            vol   = float(np.sqrt(w_opt @ Sigma @ w_opt))
            vols.append(vol)
            rets.append(mu_target)
            weights.append(w_opt.tolist())

    # Minimum variance portfolio
    prob_mv = cp.Problem(cp.Minimize(cp.quad_form(w, Sigma)),
                         constraints)
    prob_mv.solve(solver=cp.SCS, verbose=False)
    w_mv = np.array(w_mv.value) if (w_mv := w).value is not None else np.ones(N)/N

    return {
        "frontier_vols":    vols,
        "frontier_returns": rets,
        "frontier_weights": weights,
        "min_var_weights":  w_mv.tolist(),
        "min_var_vol":      float(np.sqrt(w_mv @ Sigma @ w_mv)),
        "min_var_ret":      float(mu @ w_mv),
    }

def max_sharpe(mu: np.ndarray, Sigma: np.ndarray, rf: float = 0.0) -> dict:
    """Maximum Sharpe ratio portfolio via Markowitz tangency transform."""
    N    = len(mu)
    y    = cp.Variable(N, nonneg=True)
    k    = cp.Variable()
    excess = mu - rf
    constraints = [excess @ y == 1, cp.sum(y) == k]
    prob = cp.Problem(cp.Minimize(cp.quad_form(y, Sigma)), constraints)
    prob.solve(solver=cp.SCS, verbose=False)
    w_tangent = np.array(y.value) / float(k.value)
    ret = float(mu @ w_tangent)
    vol = float(np.sqrt(w_tangent @ Sigma @ w_tangent))
    return {"weights": w_tangent.tolist(), "return": ret, "vol": vol,
            "sharpe": (ret - rf) / vol}`,
    explanation:
      "Convex optimization via CVXPY formulates the mean-variance problem exactly as a QCQP (quadratic-constrained quadratic program), enabling efficient exact solutions for up to a few thousand assets. The Markowitz tangency transformation (substitute w = y/k, constrain (mu-rf)'y = 1) converts the non-convex max-Sharpe problem into a convex quadratic minimisation — this is the standard trick for efficiently finding the tangency portfolio.",
  },
  {
    id: "pyfin-20260610-b1-pca-yield-curve",
    language: "python",
    tag: "finance",
    title: "PCA on yield curve — level, slope, curvature factor extraction",
    code: `import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler

def yield_curve_pca(yields: pd.DataFrame,
                     n_components: int = 3,
                     standardise: bool = False) -> dict:
    """
    Apply PCA to a panel of yield observations.
    yields: (T, N) — T dates, N maturities (e.g. 3M, 6M, 1Y, 2Y, 5Y, 10Y, 30Y).
    First 3 PCs typically explain >99% of yield curve variation:
    PC1 = level (parallel shift), PC2 = slope (short-long spread),
    PC3 = curvature (butterfly).
    """
    Y = yields.dropna().values   # (T, N)

    if standardise:
        Y = StandardScaler().fit_transform(Y)  # unit variance per maturity

    # Mean-centre
    mu    = Y.mean(axis=0)
    Y_c   = Y - mu

    # SVD-based PCA (numerically stable, equivalent to eigen-decomposition of YY^T)
    U, s, Vt = np.linalg.svd(Y_c, full_matrices=False)
    loadings  = Vt[:n_components]           # (n_components, N) — eigenvectors
    scores    = Y_c @ Vt[:n_components].T   # (T, n_components) — factor realisations
    expl_var  = (s[:n_components]**2) / np.sum(s**2)

    # Sign convention: PC1 loadings should be positive (level = parallel move up)
    for k in range(n_components):
        if loadings[k].mean() < 0:
            loadings[k] = -loadings[k]
            scores[:, k] = -scores[:, k]

    maturities = list(yields.columns)
    return {
        "loadings":          {f"PC{k+1}": loadings[k].tolist() for k in range(n_components)},
        "explained_var":     expl_var.tolist(),
        "cumulative_var":    np.cumsum(expl_var).tolist(),
        "factor_scores":     pd.DataFrame(scores, index=yields.dropna().index,
                                          columns=[f"PC{k+1}" for k in range(n_components)]),
        "mean_curve":        dict(zip(maturities, mu.round(4))),
        "reconstruct":       lambda scores_new: scores_new @ loadings + mu,
    }`,
    explanation:
      "The three-factor PCA decomposition of the yield curve is not merely empirical — it corresponds to the three building blocks of interest rate dynamics: a parallel shock (monetary policy stance), a twist (steepening/flattening expectations), and a butterfly (medium-term richening/cheapening relative to ends). These factors typically explain 94%, 4%, and 1% of variance respectively, making them the natural risk factors for portfolio immunisation.",
  },
  {
    id: "pyfin-20260610-b1-risk-parity",
    language: "python",
    tag: "finance",
    title: "Risk parity portfolio — equal risk contribution optimization",
    code: `import numpy as np
from scipy.optimize import minimize

def risk_contributions(w: np.ndarray, Sigma: np.ndarray) -> np.ndarray:
    """Marginal risk contribution: RC_i = w_i * (Sigma @ w)_i / port_vol."""
    port_vol = float(np.sqrt(w @ Sigma @ w))
    mrc      = Sigma @ w                # marginal risk: dVol/dw_i
    rc       = w * mrc / port_vol       # contribution = weight * marginal
    return rc

def risk_parity(Sigma: np.ndarray,
                target_risk: float | None = None,
                budget: np.ndarray | None = None) -> dict:
    """
    Equal (or budgeted) risk contribution portfolio.
    Minimises sum_{i,j} (RC_i - budget_i)^2 subject to sum(w)=1, w>=0.
    budget=None -> equal risk contribution (1/N per asset).
    """
    N = Sigma.shape[0]
    b = budget if budget is not None else np.ones(N) / N

    def obj(w):
        vol  = float(np.sqrt(w @ Sigma @ w))
        if vol < 1e-10:
            return 1e10
        rc = w * (Sigma @ w) / vol
        # Minimise sum of squared differences from budget
        return float(np.sum((rc / vol - b)**2))

    # Gradient for speed
    def grad(w):
        vol  = float(np.sqrt(w @ Sigma @ w))
        rc   = w * (Sigma @ w) / vol
        diff = rc / vol - b
        drc  = ((np.diag(Sigma @ w) + np.outer(w, Sigma).diagonal()[:, None] *
                 np.eye(N)) - np.outer(rc, w @ Sigma)) / vol**2
        return 2 * drc.T @ diff

    constraints = [{"type": "eq", "fun": lambda w: w.sum() - 1}]
    bounds      = [(1e-4, 1.0)] * N
    w0          = np.ones(N) / N

    res = minimize(obj, w0, jac=grad, method="SLSQP",
                   bounds=bounds, constraints=constraints,
                   options={"ftol": 1e-12, "maxiter": 2000})
    w_opt = res.x / res.x.sum()
    rc    = risk_contributions(w_opt, Sigma)
    vol   = float(np.sqrt(w_opt @ Sigma @ w_opt))

    return {
        "weights":             w_opt.round(6).tolist(),
        "risk_contributions":  rc.round(6).tolist(),
        "risk_contribution_pct": (rc / vol).round(4).tolist(),
        "portfolio_vol_ann":   round(vol * np.sqrt(252), 4),
        "max_rc_deviation":    round(float(np.max(np.abs(rc / vol - b))), 6),
    }`,
    explanation:
      "Risk parity equalises the marginal risk contribution of each asset rather than the capital allocation — in a mean-variance portfolio, a 60/40 stock-bond portfolio allocates 90%+ of risk to equities because equity volatility is ~3× bond volatility. The equal-RC condition RC_i = RC_j is equivalent to w_i * (Σw)_i = w_j * (Σw)_j, a system that has no closed-form solution but converges quickly with SLSQP.",
  },
  {
    id: "pyfin-20260610-b1-cir-bond-py",
    language: "python",
    tag: "finance",
    title: "CIR bond pricing — closed-form ZCB and yield curve",
    code: `import numpy as np

def cir_zcb(r0: float, kappa: float, theta: float, sigma: float, T: float) -> dict:
    """
    Cox-Ingersoll-Ross (1985) closed-form zero-coupon bond price.
    P(0,T) = A(T) * exp(-B(T) * r0).
    Requires: Feller condition 2*kappa*theta > sigma^2 for r > 0 a.s.
    """
    if T < 1e-9:
        return {"price": 1.0, "yield": r0, "B": 0.0, "logA": 0.0}

    gamma = np.sqrt(kappa**2 + 2*sigma**2)
    e_gT  = np.exp(gamma * T)
    denom = (gamma + kappa) * (e_gT - 1) + 2*gamma

    B    = 2 * (e_gT - 1) / denom
    logA = (2*kappa*theta / sigma**2) * np.log(
        2 * gamma * np.exp(0.5*(kappa + gamma)*T) / denom
    )
    P    = float(np.exp(logA - B*r0))
    y    = -np.log(P) / T

    # Feller condition check
    feller_ok = 2*kappa*theta > sigma**2

    return {
        "price":      round(P, 8),
        "yield":      round(float(y), 6),
        "B":          round(float(B), 6),
        "logA":       round(float(logA), 6),
        "feller_ok":  feller_ok,
    }

def cir_yield_curve(r0: float, kappa: float, theta: float, sigma: float,
                     tenors: list | None = None) -> dict:
    """
    Build CIR yield curve across tenors.
    Long-run yield -> theta - sigma^2 / (2*kappa^2) as T -> inf.
    """
    if tenors is None:
        tenors = [0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30]

    long_run_yield = kappa * theta / (kappa + gamma_inf := np.sqrt(kappa**2 + 2*sigma**2))
    # More precisely: y(inf) = 2*kappa*theta / (kappa + gamma)
    long_run_approx = 2*kappa*theta / (kappa + np.sqrt(kappa**2 + 2*sigma**2))

    curve = {}
    for T in tenors:
        res = cir_zcb(r0, kappa, theta, sigma, T)
        curve[T] = res["yield"]

    return {
        "yields":          curve,
        "long_run_yield":  round(float(long_run_approx), 6),
        "short_rate_r0":   r0,
        "mean_revert_to":  theta,
        "feller":          2*kappa*theta > sigma**2,
    }`,
    explanation:
      "The CIR affine term structure formula factors the ZCB price into an exponential drift A(T) and a rate-sensitivity B(T): as T → ∞, B(T) saturates at 2/(κ+γ) — rates above a threshold have a bounded effect on long-dated bonds. The Feller condition (2κθ > σ²) is the key structural constraint: when violated, the simulated short rate can touch zero and the analytical formula breaks down.",
  },
  {
    id: "pyfin-20260610-b1-bachelier-model",
    language: "python",
    tag: "finance",
    title: "Bachelier normal model — option pricing for negative rates",
    code: `import numpy as np
from scipy.stats import norm

def bachelier_call(F: float, K: float, sigma_n: float, T: float,
                   df: float = 1.0) -> dict:
    """
    Bachelier (1900) / normal model: dF = sigma_n * dW (additive diffusion).
    Call: C = df * [(F-K) * Phi(d) + sigma_n*sqrt(T) * phi(d)]
    where d = (F-K) / (sigma_n*sqrt(T)).
    Valid when F or K < 0 (negative rates, spreads) — lognormal breaks down.
    """
    sqT = np.sqrt(T)
    if sqT < 1e-9 or sigma_n < 1e-9:
        return {"call": max(F - K, 0.0) * df, "put": max(K - F, 0.0) * df,
                "d": 0.0, "delta": float(F > K), "vega": 0.0}

    d     = (F - K) / (sigma_n * sqT)
    Nd    = norm.cdf(d)
    phid  = norm.pdf(d)
    call  = df * ((F - K) * Nd + sigma_n * sqT * phid)
    put   = df * ((K - F) * norm.cdf(-d) + sigma_n * sqT * phid)   # put-call parity

    delta_call = df * Nd
    vega        = df * sqT * phid   # per unit of sigma_n

    return {
        "call":        round(float(call), 8),
        "put":         round(float(put),  8),
        "d":           round(float(d), 4),
        "delta_call":  round(float(delta_call), 6),
        "delta_put":   round(float(delta_call - df), 6),
        "vega":        round(float(vega), 8),
    }

def normal_implied_vol(F: float, K: float, T: float, market_price: float,
                        is_call: bool = True, df: float = 1.0) -> float:
    """Invert Bachelier formula numerically for normal implied vol."""
    from scipy.optimize import brentq

    intrinsic = max((F - K if is_call else K - F), 0.0) * df
    if market_price <= intrinsic + 1e-10:
        return 0.0

    def obj(sigma):
        r = bachelier_call(F, K, sigma, T, df)
        return (r["call"] if is_call else r["put"]) - market_price

    return brentq(obj, 1e-8, 5.0 * abs(F - K) / np.sqrt(T), xtol=1e-9)`,
    explanation:
      "The Bachelier model treats prices as arithmetic Brownian motion rather than geometric — this is equivalent to assuming additive (normal) rather than multiplicative (lognormal) returns. It became the standard for rate instruments when yields went negative in Europe and Japan after 2014, because lognormal models require positive forwards whereas Bachelier handles arbitrary real-valued forwards without modification.",
  },
  {
    id: "pyfin-20260610-b1-age-weighted-hs-var",
    language: "python",
    tag: "finance",
    title: "Age-weighted historical simulation VaR — exponential time decay",
    code: `import numpy as np
import pandas as pd

def hs_var_age_weighted(returns: pd.Series,
                          alpha: float = 0.99,
                          decay: float = 0.99,
                          min_obs: int = 250) -> dict:
    """
    BIS / RiskMetrics hybrid HS VaR: historical simulation with exponential time decay.
    Older scenarios receive weight decay^(T-t) / sum_weights.
    Balances full-sample coverage with responsiveness to recent vol regime.
    """
    r = returns.dropna().values[::-1]   # most recent first
    T = len(r)
    if T < min_obs:
        raise ValueError(f"Need at least {min_obs} observations, have {T}")

    # Exponentially decaying weights: most recent = weight 1, oldest = decay^(T-1)
    ages    = np.arange(T)
    raw_w   = decay ** ages
    w       = raw_w / raw_w.sum()   # normalise to sum=1

    # Sort returns ascending, accumulate weights from left (worst scenarios first)
    order   = np.argsort(r)         # indices of sorted returns (ascending)
    r_sort  = r[order]
    w_sort  = w[order]
    cum_w   = np.cumsum(w_sort)

    # VaR = smallest loss such that cumulative weight >= 1-alpha
    var_idx  = np.searchsorted(cum_w, 1.0 - alpha)
    var_idx  = min(var_idx, T - 1)
    VaR      = -r_sort[var_idx]

    # CVaR (Expected Shortfall): weighted average of scenarios beyond VaR
    tail_mask = cum_w <= (1.0 - alpha)
    if tail_mask.sum() > 0:
        tail_w   = w_sort[tail_mask]
        tail_r   = r_sort[tail_mask]
        CVaR     = -float(np.dot(tail_r, tail_w) / tail_w.sum())
    else:
        CVaR = VaR

    # Effective number of observations: 1 / sum(w^2) -- Bai measure
    eff_n = 1.0 / np.sum(w**2)

    return {
        "VaR_1d":       round(float(VaR),  6),
        "CVaR_1d":      round(float(CVaR), 6),
        "VaR_10d":      round(float(VaR * np.sqrt(10)), 6),
        "confidence":   alpha,
        "decay":        decay,
        "n_obs":        T,
        "eff_n_obs":    round(float(eff_n), 1),
        "weight_today": round(float(w[0]), 6),
    }`,
    explanation:
      "Age-weighted HS VaR (Hull-White 1998) addresses the two main criticisms of plain HS: equal weighting gives a 500-day-old crash the same weight as yesterday's move, and the estimate does not adapt to changing volatility regimes. Exponential decay with lambda=0.99 effectively assigns ~50% of the total weight to the most recent 69 days, making the VaR estimate responsive without fully discarding tail events.",
  },
  {
    id: "pyfin-20260610-b1-variance-swap",
    language: "python",
    tag: "finance",
    title: "Variance swap replication — log-contract discrete approximation",
    code: `import numpy as np
from scipy.stats import norm

def variance_swap_strike(F0: float, r: float, T: float,
                          call_strikes: np.ndarray,
                          put_strikes: np.ndarray,
                          call_vols: np.ndarray,
                          put_vols: np.ndarray) -> dict:
    """
    Demeterfi-Derman-Kamal-Zou (1999): fair variance strike K_var = E[RV].
    Replicated by a strip of OTM options:
    K_var = 2/T * [ sum_i w_i * C(K_i) / K_i^2 + sum_j w_j * P(K_j) / K_j^2 ]
    This is model-free (no distributional assumption) up to jump risk.
    """
    disc = np.exp(-r * T)
    sqT  = np.sqrt(T)

    def bs_price(F, K, sigma, T, disc, is_call):
        d1 = (np.log(F/K) + 0.5*sigma**2*T) / (sigma*sqT)
        d2 = d1 - sigma*sqT
        if is_call:
            return disc * (F*norm.cdf(d1) - K*norm.cdf(d2))
        return disc * (K*norm.cdf(-d2) - F*norm.cdf(-d1))

    # Integration weights: trapezoidal rule using equal strike spacing
    def strip_pv(strikes, vols, is_call):
        if len(strikes) == 0:
            return 0.0
        dK  = np.gradient(strikes)
        pv  = 0.0
        for K, sigma, dk in zip(strikes, vols, dK):
            C   = bs_price(F0, K, sigma, T, disc, is_call)
            pv += C * dk / (K**2)
        return 2 / T * pv

    replication_pv = strip_pv(call_strikes, call_vols, True) + \
                     strip_pv(put_strikes,  put_vols,  False)

    # ATM vol for comparison
    atm_idx  = np.argmin(np.abs(call_strikes - F0))
    atm_vol  = call_vols[atm_idx] if len(call_vols) > 0 else 0.2
    convexity_adj = atm_vol**2 * T   # approx: K_var ≈ sigma_atm^2 + convexity

    return {
        "var_strike":      round(float(replication_pv), 8),
        "vol_strike":      round(float(np.sqrt(replication_pv / T)), 6),
        "atm_vol":         round(float(atm_vol), 6),
        "convexity_adj_bps": round((np.sqrt(replication_pv/T) - atm_vol) * 10000, 2),
    }`,
    explanation:
      "The variance swap replication formula shows that realised variance is spanned by a strip of vanilla options — the key insight is that a static position in log S (the log-contract) perfectly replicates variance, and the log-contract can be approximated by options via a Taylor expansion. The replication is model-free but depends on the existence of a complete smile (all strikes), making it sensitive to the interpolation/extrapolation of the vol surface.",
  },
  {
    id: "pyfin-20260610-b1-quanto-adj-py",
    language: "python",
    tag: "finance",
    title: "Quanto adjustment — FX correlation drift correction for cross-currency options",
    code: `import numpy as np
from scipy.stats import norm

def quanto_adjusted_forward(S0: float, r_d: float, r_f: float,
                              sigma_S: float, sigma_FX: float,
                              rho: float, T: float) -> float:
    """
    Quanto forward: expected value of S_T under domestic risk-neutral measure.
    Under Q_d: dS = (r_f - q - rho*sigma_S*sigma_FX) * S dt + sigma_S * S * dW_d
    Adjusted forward = S0 * exp((r_d - r_f - rho*sigma_S*sigma_FX)*T)
    Wait — standard quanto: F_q = S0 * exp((r_d - r_f - rho*sigma_S*sigma_FX)*T)
    """
    return S0 * np.exp((r_d - r_f - rho * sigma_S * sigma_FX) * T)

def quanto_call(S0: float, K: float, r_d: float, r_f: float,
                 sigma_S: float, sigma_FX: float, rho: float, T: float) -> dict:
    """
    Price a quanto call with unit FX notional.
    For a Nikkei option with USD payout at fixed 1 USD per 1 JPY point.
    """
    F_q = quanto_adjusted_forward(S0, r_d, r_f, sigma_S, sigma_FX, rho, T)
    df  = np.exp(-r_d * T)
    sqT = np.sqrt(T)

    d1 = (np.log(F_q / K) + 0.5 * sigma_S**2 * T) / (sigma_S * sqT)
    d2 = d1 - sigma_S * sqT

    call  = df * (F_q * norm.cdf(d1) - K * norm.cdf(d2))
    put   = df * (K * norm.cdf(-d2) - F_q * norm.cdf(-d1))

    # Delta and correlation sensitivity (dP/d_rho)
    delta       = df * norm.cdf(d1)
    corr_sens   = -df * F_q * sigma_S * sigma_FX * T * norm.cdf(d1)  # dCall/d_rho

    # Standard call without adjustment for comparison
    F_std = S0 * np.exp((r_d - r_f) * T)
    d1_std = (np.log(F_std/K) + 0.5*sigma_S**2*T) / (sigma_S*sqT)
    call_no_adj = df * (F_std*norm.cdf(d1_std) - K*norm.cdf(d1_std - sigma_S*sqT))

    return {
        "quanto_call":    round(float(call), 6),
        "quanto_put":     round(float(put), 6),
        "call_no_adj":    round(float(call_no_adj), 6),
        "quanto_fwd":     round(float(F_q), 4),
        "adjustment_pct": round((F_q / F_std - 1) * 100, 4),
        "corr_sens":      round(float(corr_sens), 6),
        "delta":          round(float(delta), 6),
    }`,
    explanation:
      "The quanto adjustment arises because converting the payoff to domestic currency at a fixed rate breaks the standard risk-neutral drift — the FX rate is correlated with the underlying, creating a covariance term in the Girsanov change of measure. A positive rho (foreign asset rises with FX) reduces the adjusted forward because the quanto payoff is less valuable when foreign currency appreciation is correlated with the underlying gain.",
  },
  {
    id: "pyfin-20260610-b1-barra-factor-risk",
    language: "python",
    tag: "finance",
    title: "Barra-style factor risk decomposition — systematic vs idiosyncratic",
    code: `import numpy as np
import pandas as pd

def factor_risk_decomposition(
    weights: np.ndarray,           # portfolio weights (N,)
    factor_exposures: np.ndarray,  # asset factor loadings B (N, K)
    factor_cov: np.ndarray,        # factor covariance matrix F (K, K)
    specific_var: np.ndarray,      # idiosyncratic variance Delta (N,)
) -> dict:
    """
    Barra multi-factor risk model:
    Sigma = B F B^T + Delta   (total covariance matrix)
    Risk decomposition:
    - Systematic (factor) variance: w^T B F B^T w
    - Idiosyncratic (specific) variance: w^T Delta w
    All risk in annualised vol (multiply variance by 252 if daily factor cov).
    """
    N, K = factor_exposures.shape
    B     = factor_exposures
    F     = factor_cov
    Delta = np.diag(specific_var)

    # Total portfolio variance
    Sigma     = B @ F @ B.T + Delta
    port_var  = float(weights @ Sigma @ weights)
    port_vol  = float(np.sqrt(port_var))

    # Factor variance: contribution from systematic risk
    Bw        = B.T @ weights              # portfolio's factor exposures (K,)
    factor_var = float(Bw @ F @ Bw)

    # Idiosyncratic variance
    idio_var   = float(weights**2 @ specific_var)

    # Per-factor contribution
    F_chol         = np.linalg.cholesky(F)
    factor_loads_w = F_chol.T @ Bw        # rotated factor exposures
    per_factor_var = factor_loads_w**2
    per_factor_pct = per_factor_var / max(factor_var, 1e-15)

    # Asset-level marginal risk contribution
    mrc   = Sigma @ weights
    rc    = weights * mrc
    rc_pct = rc / port_var

    return {
        "port_vol":       round(float(port_vol), 6),
        "factor_vol":     round(float(np.sqrt(factor_var)), 6),
        "idio_vol":       round(float(np.sqrt(idio_var)), 6),
        "factor_pct":     round(float(factor_var / port_var), 4),
        "idio_pct":       round(float(idio_var / port_var), 4),
        "per_factor_pct": per_factor_pct.round(4).tolist(),
        "asset_rc":       rc.round(6).tolist(),
        "asset_rc_pct":   rc_pct.round(4).tolist(),
    }`,
    explanation:
      "The Barra decomposition separates portfolio risk into the portion explained by common risk factors (market, sector, style) and the portion that is asset-specific — idiosyncratic. For a diversified portfolio, idiosyncratic risk approaches zero, leaving only systematic factor exposure. Active managers use this to ensure their alpha bets (stock selection) are not swamped by unintended factor tilts.",
  },
  {
    id: "pyfin-20260610-b1-ou-mle",
    language: "python",
    tag: "finance",
    title: "Ornstein-Uhlenbeck MLE — mean reversion speed and half-life estimation",
    code: `import numpy as np
from scipy.optimize import minimize

def ou_mle_closed_form(X: np.ndarray, dt: float) -> dict:
    """
    Closed-form MLE for discretised OU: X_t = phi*X_{t-1} + c + epsilon_t.
    phi = exp(-kappa*dt), c = mu*(1-phi), Var(epsilon) = sigma^2*(1-phi^2)/(2*kappa).
    Derived from OLS regression of X_t on X_{t-1}.
    """
    n  = len(X) - 1
    Sx = X[:-1].sum();  Sy = X[1:].sum()
    Sxx = (X[:-1]**2).sum(); Sxy = (X[:-1]*X[1:]).sum(); Syy = (X[1:]**2).sum()

    # OLS coefficients
    phi   = (n*Sxy - Sx*Sy) / (n*Sxx - Sx**2)
    c     = (Sy - phi*Sx) / n
    resid = X[1:] - phi*X[:-1] - c
    s2    = float(np.var(resid, ddof=2))   # MLE variance

    # Recover OU parameters
    kappa = -np.log(max(phi, 1e-10)) / dt
    mu    = c / (1 - phi) if abs(1 - phi) > 1e-10 else 0.0
    sigma = np.sqrt(max(s2 * 2 * kappa / (1 - phi**2), 0.0))

    half_life = np.log(2) / max(kappa, 1e-10)   # in same units as dt

    # Stationarity: phi < 1 (kappa > 0); also t-stat for testing mean reversion
    se_phi   = np.sqrt(s2 / (Sxx - Sx**2/n))
    t_mr     = (phi - 1.0) / se_phi   # t-test: H0: phi=1 (unit root, no mean reversion)

    return {
        "kappa":       round(float(kappa), 4),
        "mu":          round(float(mu), 6),
        "sigma":       round(float(sigma), 6),
        "phi":         round(float(phi), 6),
        "half_life":   round(float(half_life), 2),
        "resid_std":   round(float(np.sqrt(s2)), 6),
        "t_stat_mr":   round(float(t_mr), 3),   # < -2 -> reject unit root
        "r_squared":   round(float(1 - s2/np.var(X[1:])), 4),
    }

def ou_half_life_from_returns(prices: np.ndarray) -> dict:
    """Estimate mean-reversion half-life from price/spread series."""
    log_p = np.log(prices) if np.all(prices > 0) else prices
    dt    = 1.0   # assume daily
    return ou_mle_closed_form(log_p, dt)`,
    explanation:
      "The OU MLE has a closed-form solution via OLS because the discrete-time transition X_t = φX_{t-1} + c + ε is a linear regression — the maximum likelihood estimate of the AR(1) parameters is identical to the OLS estimate for Gaussian innovations. The half-life κ⁻¹ ln(2) is the practical measure of mean reversion speed reported to traders: a spread with a 5-day half-life returns halfway to equilibrium in 5 days on average.",
  },
  {
    id: "pyfin-20260610-b1-hmm-regime",
    language: "python",
    tag: "finance",
    title: "HMM regime detection — bull/bear/crash states from returns",
    code: `import numpy as np
from hmmlearn.hmm import GaussianHMM
import pandas as pd

def fit_regime_hmm(returns: pd.Series,
                   n_states: int = 3,
                   n_iter: int = 200,
                   seed: int = 42) -> dict:
    """
    Fit a Gaussian HMM to identify latent market regimes:
    State 0: bull  (high mu, low sigma)
    State 1: bear  (low/negative mu, high sigma)
    State 2: crash (very negative mu, extreme sigma)
    States are automatically ordered by mean return after fitting.
    """
    r = returns.dropna().values.reshape(-1, 1)

    model = GaussianHMM(
        n_components=n_states,
        covariance_type="full",
        n_iter=n_iter,
        random_state=seed,
        tol=1e-5,
    )
    model.fit(r)

    # Posterior state probabilities (smoothed)
    posteriors = model.predict_proba(r)    # (T, n_states)
    states     = model.predict(r)          # Viterbi decoded state sequence

    # Sort states by mean return (ascending: crash=0, bull=n_states-1)
    mus   = model.means_.flatten()
    order = np.argsort(mus)   # reorder so state 0 = lowest mean

    # Annualised stats per state
    state_stats = {}
    for rank, orig in enumerate(order):
        mask = (states == orig)
        if mask.sum() < 2:
            continue
        r_state = returns.dropna().values[mask]
        label   = ["crash", "bear", "bull"][rank] if n_states == 3 else f"state_{rank}"
        state_stats[label] = {
            "mean_ann":   round(float(mus[orig]) * 252, 4),
            "vol_ann":    round(float(np.sqrt(model.covars_[orig][0,0]) * np.sqrt(252)), 4),
            "freq":       round(float(mask.mean()), 3),
            "sharpe_ann": round(float(mus[orig] * 252 /
                           (np.sqrt(model.covars_[orig][0,0]) * np.sqrt(252) + 1e-9)), 2),
        }

    # Transition matrix (reordered)
    T_mat = model.transmat_[np.ix_(order, order)]
    # Expected duration in each state = 1/(1 - p_{ii})
    durations = {list(state_stats.keys())[k]: round(1.0/(1 - T_mat[k,k]), 1)
                 for k in range(n_states)}

    return {
        "state_stats":       state_stats,
        "transition_matrix": T_mat.round(4).tolist(),
        "state_durations":   durations,
        "decoded_states":    pd.Series(states, index=returns.dropna().index),
        "posteriors":        posteriors,
        "log_likelihood":    round(float(model.score(r)), 2),
    }`,
    explanation:
      "The Gaussian HMM identifies latent regimes by fitting a mixture of Gaussians with Markov transition dynamics — unlike k-means, the state sequence is temporally correlated and states switch with transition probabilities rather than independently. The Viterbi algorithm decodes the most likely state sequence globally, while the forward-backward algorithm provides smooth posteriors. Expected duration 1/(1-p_{ii}) is the key output for holding period analysis.",
  },
  {
    id: "pyfin-20260610-b1-cds-dv01",
    language: "python",
    tag: "finance",
    title: "CDS DV01 and CS01 — credit spread sensitivity estimation",
    code: `import numpy as np
from scipy.optimize import brentq

def cds_rpv01_and_cs01(
    tenors: list,                    # [0.25, 0.5, 1, 2, 3, 5, 7, 10]
    hazard_rates: dict,              # {tenor: h} bootstrapped piecewise hazard
    disc_factors: np.ndarray,        # risk-free discount factors at payment dates
    recovery: float = 0.40,
    coupon_freq: int = 4,
    notional: float = 1_000_000,     # USD
) -> dict:
    """
    Compute RPV01 (per unit spread, per unit notional) and CS01 (1bp credit spread move).
    CS01 ≈ -RPV01 * notional / 10000  (for a protection buyer).
    """
    dt         = 1.0 / coupon_freq
    t_grid     = np.arange(dt, tenors[-1] + dt/2, dt)
    n          = len(t_grid)
    D          = disc_factors[:n]   # match lengths

    # Build survival probability from piecewise-constant hazard rates
    surv = np.ones(n + 1)
    t_prev = 0.0
    for i, t in enumerate(t_grid):
        # Find which hazard segment we're in
        seg_tenor = min([k for k in sorted(hazard_rates.keys()) if k >= t],
                        default=sorted(hazard_rates.keys())[-1])
        h = hazard_rates[seg_tenor]
        surv[i+1] = surv[i] * np.exp(-h * (t - t_prev))
        t_prev = t

    Q     = surv[1:]   # survival probs at payment dates
    Q_prev = surv[:-1]

    # RPV01 = risky annuity = sum dt * D * Q
    rpv01 = float(np.sum(dt * D * Q))

    # Protection PV = (1-R) * sum D * (Q_prev - Q)
    prot_pv = (1 - recovery) * float(np.sum(D * (Q_prev - Q)))

    # Fair spread
    fair_spread_bps = (prot_pv / rpv01 * 10_000) if rpv01 > 1e-10 else 0.0

    # CS01: dollar change for 1bp parallel shift in hazard rate
    # Approximate: CS01 ≈ RPV01 (in practice slightly nonlinear)
    cs01 = rpv01 * notional / 10_000   # dollars per 1bp tighter spread

    return {
        "rpv01":           round(float(rpv01), 6),
        "protection_pv":   round(float(prot_pv), 6),
        "fair_spread_bps": round(float(fair_spread_bps), 2),
        "cs01_dollars":    round(float(cs01), 2),
        "ir01_approx":     round(float(rpv01 * notional * 0.0001), 2),
        "survival_5y":     round(float(Q[min(4*5-1, n-1)]), 6),
    }`,
    explanation:
      "The RPV01 (risky PV01) for a CDS represents the present value of receiving 1bp per year in spread, adjusted for default survival probability. CS01 translates RPV01 into dollar terms: a 1bp spread widening costs the protection seller CS01 dollars per notional. The asymmetry between IR01 (interest rate sensitivity) and CS01 (spread sensitivity) is why CDS traders hedge spread risk separately from rate risk.",
  },
  {
    id: "pyfin-20260610-b1-cms-convexity",
    language: "python",
    tag: "finance",
    title: "CMS convexity adjustment — linear swap rate vs CMS rate correction",
    code: `import numpy as np
from scipy.stats import norm

def cms_convexity_adjustment(
    swap_rate: float,       # current par swap rate (e.g. 0.05 for 5%)
    sigma_atm: float,       # ATM swaption vol (lognormal)
    T: float,               # CMS fixing date (option expiry)
    tenor: float,           # swap tenor in years (e.g. 10 for 10Y)
    freq: int = 2,          # coupon frequency (2=semi-annual)
    r: float = 0.04,        # flat discount rate (simplification)
) -> dict:
    """
    Hagan (2003) CMS convexity adjustment.
    CMS rate = swap rate + convexity adjustment.
    Adjustment comes from Jensen's inequality: E[S_T] != par swap rate
    because the CMS payoff is paid at T but the swap runs to T+tenor.

    Simplified Hull-White approximation for the adjustment:
    adj ≈ sigma_atm^2 * T * G'(S) / G(S) * (annuity_duration)
    where G(S) = annuity factor = sum (1+S/2)^{-i} for i=1..2*tenor.
    """
    n  = int(tenor * freq)    # number of coupon periods
    dt = 1.0 / freq

    # Annuity factor G(S) = PV of 1 per period unit notional
    def annuity(S):
        return sum((1 + S*dt)**(-i) for i in range(1, n+1))

    # First derivative G'(S)
    def annuity_deriv(S, eps=1e-5):
        return (annuity(S + eps) - annuity(S - eps)) / (2*eps)

    G  = annuity(swap_rate)
    Gp = annuity_deriv(swap_rate)

    # Replication approach: E[S_T * A_T] / E[A_T] under annuity measure
    # Hagan approximate: adj = sigma^2 * S * T * (-G'(S)/G(S)) * correction
    ratio = -Gp / G if abs(G) > 1e-10 else 0.0
    adj   = sigma_atm**2 * swap_rate * T * ratio

    # More accurate: numerical integration over the lognormal distribution of S
    # (requires full smile data; here we use the ATM approximation)
    cms_rate = swap_rate + adj
    cms_bps  = adj * 10_000

    return {
        "swap_rate":    round(float(swap_rate), 6),
        "cms_rate":     round(float(cms_rate), 6),
        "adj_bps":      round(float(cms_bps), 2),
        "annuity_G":    round(float(G), 4),
        "G_prime":      round(float(Gp), 4),
        "ratio_Gp_G":   round(float(ratio), 6),
    }`,
    explanation:
      "The CMS convexity adjustment arises because a CMS payment is made at the observation date T but references a swap rate that itself depends on post-T cash flows — the payment and discount periods do not align. The correction has the same sign as a long-convexity position: Jensen's inequality means E[1/annuity] > 1/E[annuity], so the CMS fixing is worth more than the corresponding forward swap rate.",
  },
  {
    id: "pyfin-20260610-b1-implied-dividend",
    language: "python",
    tag: "finance",
    title: "Implied dividend extraction — from European put-call parity",
    code: `import numpy as np
import pandas as pd

def extract_implied_dividends(
    calls: pd.DataFrame,      # columns: strike, price; rows: options at same expiry
    puts: pd.DataFrame,       # same structure
    S0: float,
    r: float,
    T: float,
    min_liquidity_threshold: float = 0.01,
) -> dict:
    """
    Put-call parity: C - P = S * exp(-q*T) - K * exp(-r*T)
    => S * exp(-q*T) = C - P + K * exp(-r*T)
    Model-free: no distributional assumptions required.
    Use near-ATM strikes for best bid-ask symmetry.
    """
    # Merge calls and puts on strike
    df = pd.merge(calls, puts, on="strike", suffixes=("_call", "_put"))
    df = df[df["price_call"] > min_liquidity_threshold]
    df = df[df["price_put"]  > min_liquidity_threshold]

    disc    = np.exp(-r * T)
    # From parity: F = C - P + K * disc (implied forward)
    df["implied_fwd"] = df["price_call"] - df["price_put"] + df["strike"] * disc

    # Best estimate: use ATM strikes where bid-ask is tightest
    df["moneyness"] = abs(df["strike"] - S0) / S0
    near_atm = df[df["moneyness"] < 0.05]

    if len(near_atm) < 2:
        near_atm = df

    implied_fwd   = float(near_atm["implied_fwd"].median())
    implied_disc  = implied_fwd / S0          # exp(-q*T)
    implied_div_q = -np.log(implied_disc) / T  # continuous dividend yield

    # Dollar dividend (PV): D = S0 - F * exp(-r*T) under simplified model
    implied_div_dollar = S0 - implied_fwd * disc   # S0 - PV(forward)

    # Robustness: std across ATM strikes
    std_fwd = float(near_atm["implied_fwd"].std())

    return {
        "implied_forward":     round(float(implied_fwd), 4),
        "implied_div_yield":   round(float(implied_div_q), 6),
        "implied_div_pct":     round(float(implied_div_q * 100), 4),
        "implied_div_dollar":  round(float(implied_div_dollar), 4),
        "parity_std_atm":      round(float(std_fwd), 4),
        "n_atm_pairs":         len(near_atm),
    }`,
    explanation:
      "Put-call parity provides a model-free implied forward price F = C - P + K·e^{-rT}: any deviation from parity signals either mispricing (arbitrage) or an implied dividend not captured in the discount rate. Extracting the continuous dividend yield as q = -ln(F/S₀)/T is standard for index options where the underlying pays a dividend yield — accurate estimation of q is critical for avoiding systematic mispricing in delta-hedged books.",
  },
  {
    id: "pyfin-20260610-b1-almgren-chriss",
    language: "python",
    tag: "finance",
    title: "Almgren-Chriss optimal execution — TWAP/VWAP vs optimal trajectory",
    code: `import numpy as np

def almgren_chriss_trajectory(
    X: float,              # total shares to execute
    T: float,              # total execution horizon (days)
    N: int,                # number of intervals
    sigma: float,          # daily vol of the stock
    eta: float,            # temporary impact coefficient ($/share^2/day)
    gamma: float,          # permanent impact coefficient ($/share)
    lamb: float = 1e-6,    # risk-aversion parameter (price / variance)
) -> dict:
    """
    Almgren-Chriss (2001) optimal liquidation.
    Minimises E[cost] + lamb * Var[cost] (mean-variance of execution shortfall).
    Optimal strategy: x_k = X * sinh(kappa*(T-t_k)) / sinh(kappa*T)
    where kappa = sqrt(lamb*sigma^2 / (eta*(1 - 0.5*gamma/eta*dt))).
    Linear (TWAP) when lamb=0; front-loaded (aggressive) when lamb large.
    """
    dt   = T / N
    # Effective temporary impact (per unit time)
    eta_hat = eta / dt  # impact per interval

    # Risk-aversion parameter in the Almgren-Chriss notation
    # kappa = sqrt(lambda * sigma^2 / eta_hat)
    kappa = np.sqrt(lamb * sigma**2 / eta_hat)

    # Optimal holdings trajectory x_k (shares remaining at time t_k = k*dt)
    t_grid    = np.linspace(0, T, N + 1)
    holdings  = X * np.sinh(kappa * (T - t_grid)) / np.sinh(kappa * T)
    trades    = -np.diff(holdings)   # shares sold in each interval (positive = sell)

    # Expected execution shortfall
    # E[cost] = 0.5*gamma*X^2 + eta_hat * sum(v_k^2 * dt)
    # Var[cost] = sigma^2 * sum(x_k^2 * dt)
    v_grid    = trades / dt          # trade rate (shares/day)
    E_cost    = 0.5 * gamma * X**2 + eta_hat * np.sum(v_grid**2 * dt)
    Var_cost  = sigma**2 * np.sum(holdings[:-1]**2 * dt)

    # TWAP benchmark (equal trade in each interval)
    twap_trade = X / N
    twap_cost  = 0.5*gamma*X**2 + eta_hat * N * twap_trade**2 * dt

    return {
        "holdings":           holdings.tolist(),
        "trades_per_interval": trades.tolist(),
        "kappa":              round(float(kappa), 6),
        "E_cost":             round(float(E_cost), 4),
        "Var_cost":           round(float(Var_cost), 4),
        "TWAP_cost":          round(float(twap_cost), 4),
        "impl_shortfall_bps": round(float(E_cost / (X * sigma) * 10000), 2),
    }`,
    explanation:
      "Almgren-Chriss shows that the optimal execution trajectory depends on the ratio of market risk (sigma) to temporary impact (eta): risk-averse traders liquidate faster early (front-loading) to reduce variance exposure, while risk-neutral traders use TWAP (equal intervals). The hyperbolic-sine trajectory interpolates continuously between these extremes as the risk-aversion parameter lambda varies from 0 to infinity.",
  },
  {
    id: "pyfin-20260610-b1-stressed-var",
    language: "python",
    tag: "finance",
    title: "Stressed VaR — Basel 2.5 worst 12-month window selection",
    code: `import numpy as np
import pandas as pd

def stressed_var(returns: pd.DataFrame,      # daily returns (T, N) assets
                  weights: np.ndarray,         # portfolio weights (N,)
                  alpha: float = 0.99,
                  window_days: int = 252,
                  method: str = "historical",  # "historical" or "parametric"
                 ) -> dict:
    """
    Basel 2.5 Stressed VaR: find the 12-month window that maximises portfolio VaR.
    SVaR_t = VaR computed on the stressed (worst) period, multiplied by a factor.
    Total capital = max(VaR, multiplier*average(VaR_60d)) +
                    max(SVaR, multiplier*average(SVaR_60d)).
    """
    R = returns.dropna()
    T, N = R.shape
    port_returns = (R.values @ weights)   # scalar portfolio returns

    if T < window_days:
        raise ValueError(f"Need {window_days} observations for stressed VaR")

    # Slide window and compute VaR for each starting position
    vars_by_window = []
    for start in range(T - window_days + 1):
        window_r = port_returns[start:start + window_days]
        if method == "historical":
            v = -np.percentile(window_r, (1 - alpha) * 100)
        else:
            v = float(np.mean(window_r) - np.std(window_r, ddof=1) *
                      abs(np.percentile(np.random.standard_normal(10000), (1-alpha)*100)))
        vars_by_window.append(v)

    stressed_period_idx = int(np.argmax(vars_by_window))
    SVaR_1d = vars_by_window[stressed_period_idx]

    # Current VaR from the most recent window
    current_var = vars_by_window[-1]

    # Identify the stress period dates
    stress_start = R.index[stressed_period_idx]
    stress_end   = R.index[min(stressed_period_idx + window_days - 1, T - 1)]

    return {
        "SVaR_1d":             round(float(SVaR_1d), 6),
        "current_VaR_1d":      round(float(current_var), 6),
        "SVaR_VaR_ratio":      round(float(SVaR_1d / max(current_var, 1e-10)), 3),
        "stress_period_start": str(stress_start.date()),
        "stress_period_end":   str(stress_end.date()),
        "n_windows_searched":  len(vars_by_window),
    }`,
    explanation:
      "Basel 2.5 (2009 amendment) introduced Stressed VaR after the 2008 crisis revealed that VaR based on recent data dramatically underestimated losses during stress periods. By searching for the 252-day window that maximises portfolio VaR, regulators ensure that the capital requirement reflects the worst-case recent stress period — typically landing on the Lehman Brothers default window (Sep 2008 – Sep 2009) for most equity portfolios.",
  },
  {
    id: "pyfin-20260610-b1-realized-correlation",
    language: "python",
    tag: "finance",
    title: "Realised correlation and dispersion trade — index vs basket vol",
    code: `import numpy as np
import pandas as pd

def realized_correlation_trade(
    component_returns: pd.DataFrame,  # (T, N) daily log-returns of N components
    weights: np.ndarray,               # index weights (N,)
    window: int = 60,
    annualise: bool = True,
) -> pd.DataFrame:
    """
    Dispersion trade: long basket of single-stock vol, short index vol.
    Profit when realized correlation < implied correlation.

    Realized correlation (average pairwise):
    rho_bar = (sigma_index^2 - sum_i w_i^2 * sigma_i^2) /
              (2 * sum_{i<j} w_i * w_j * sigma_i * sigma_j)

    Index vol from index returns; component vols from individual returns.
    """
    R = component_returns.dropna()
    T = len(R)
    idx_ret = R.values @ weights   # index returns

    results = []
    for end in range(window, T + 1):
        block_R = R.values[end-window:end]
        block_I = idx_ret[end-window:end]
        factor  = 252 if annualise else 1

        # Annualised vols
        comp_vols = np.std(block_R, axis=0, ddof=1) * np.sqrt(factor)
        idx_vol   = float(np.std(block_I, ddof=1) * np.sqrt(factor))

        # Realised average correlation
        num = idx_vol**2 - np.sum((weights**2) * comp_vols**2)
        den = 2 * np.sum([weights[i] * weights[j] * comp_vols[i] * comp_vols[j]
                          for i in range(len(weights))
                          for j in range(i+1, len(weights))])
        rho_bar = num / den if den > 1e-12 else 0.0

        results.append({
            "date":       R.index[end-1],
            "idx_vol":    round(float(idx_vol), 4),
            "mean_comp_vol": round(float(np.average(comp_vols, weights=weights)), 4),
            "realized_corr": round(float(rho_bar), 4),
            "dispersion":    round(float(np.average(comp_vols, weights=weights) - idx_vol), 4),
        })

    df = pd.DataFrame(results).set_index("date")
    return df`,
    explanation:
      "Dispersion trading sells index volatility and buys single-stock volatility — profitable when implied correlation (priced into index options) exceeds realised correlation. Index vol² = Σ w_i² σ_i² + 2Σ_{i<j} w_i w_j σ_i σ_j ρ_{ij}, so the index is cheaper than the basket when realized ρ < implied ρ. Realised correlation tends to spike in crises (all stocks fall together), making dispersion trades subject to correlation blowup risk.",
  },
  {
    id: "pyfin-20260610-b1-vanna-volga",
    language: "python",
    tag: "finance",
    title: "Vanna-volga pricing — FX exotics smile correction",
    code: `import numpy as np
from scipy.stats import norm

def bs_price_greeks(F: float, K: float, r: float, sigma: float, T: float,
                     is_call: bool = True) -> dict:
    """Black-Scholes price and Greeks for FX option (using forward F)."""
    sqT = np.sqrt(T)
    d1  = (np.log(F/K) + 0.5*sigma**2*T) / (sigma*sqT)
    d2  = d1 - sigma*sqT
    df  = np.exp(-r*T)
    Nd1 = norm.cdf(d1 if is_call else -d1)
    Nd2 = norm.cdf(d2 if is_call else -d2)
    phi = norm.pdf(d1)
    sign = 1.0 if is_call else -1.0
    price = df * sign * (F*norm.cdf(sign*d1) - K*norm.cdf(sign*d2))
    vanna = -df * phi * d2 / sigma    # d^2V / (dS d_sigma)
    volga = df * F * phi * sqT * d1*d2 / sigma  # d^2V / d_sigma^2
    vega  = df * F * phi * sqT
    return {"price": price, "vanna": vanna, "volga": volga, "vega": vega}

def vanna_volga_price(
    F: float, K: float, r: float, T: float,
    sigma_atm: float, sigma_25d_call: float, sigma_25d_put: float,
    is_call: bool = True,
) -> dict:
    """
    Vanna-Volga (Castagna-Mercurio 2007): add smile correction to BS price
    using 3 market quotes (ATM, 25-delta call, 25-delta put).
    Correction = w1*(V_25c_mkt - V_25c_bs) + w2*(V_25p_mkt - V_25p_bs)
    where weights w1, w2 match the vanna and volga of the target option.
    """
    # 25-delta strikes under BSM
    sqT = np.sqrt(T)
    K_25c = F * np.exp( sigma_25d_call * sqT * norm.ppf(0.25) + 0.5*sigma_25d_call**2*T)
    K_25p = F * np.exp(-sigma_25d_put  * sqT * norm.ppf(0.25) + 0.5*sigma_25d_put**2*T)
    K_atm = F * np.exp(0.5 * sigma_atm**2 * T)

    # Target option Greeks at ATM vol
    target = bs_price_greeks(F, K, r, sigma_atm, T, is_call)

    # Reference instruments Greeks
    g25c   = bs_price_greeks(F, K_25c, r, sigma_atm, T, True)
    g25p   = bs_price_greeks(F, K_25p, r, sigma_atm, T, False)

    # Solve for weights: [vanna_25c, vanna_25p; volga_25c, volga_25p] * [w1,w2] = [vanna_T, volga_T]
    A = np.array([[g25c["vanna"], g25p["vanna"]],
                  [g25c["volga"], g25p["volga"]]])
    b = np.array([target["vanna"], target["volga"]])
    try:
        w = np.linalg.solve(A, b)
    except np.linalg.LinAlgError:
        w = np.array([0.0, 0.0])

    # Market prices of hedging instruments
    mkt_25c = bs_price_greeks(F, K_25c, r, sigma_25d_call, T, True)["price"]
    mkt_25p = bs_price_greeks(F, K_25p, r, sigma_25d_put,  T, False)["price"]
    bs_25c  = g25c["price"]
    bs_25p  = g25p["price"]

    vv_price = (target["price"]
                + w[0] * (mkt_25c - bs_25c)
                + w[1] * (mkt_25p - bs_25p))

    return {
        "vv_price":   round(float(vv_price), 8),
        "bs_price":   round(float(target["price"]), 8),
        "correction": round(float(vv_price - target["price"]), 8),
        "w1":         round(float(w[0]), 4),
        "w2":         round(float(w[1]), 4),
    }`,
    explanation:
      "The vanna-volga method adds a smile correction by replicating the exotic option's second-order vol sensitivities (vanna = ∂²V/∂S∂σ, volga = ∂²V/∂σ²) using a portfolio of three standard FX options. It is widely used for FX barrier and digital pricing because it is computationally cheap and reproduces market smile prices well in the FX market, where exactly three market quotes (ATM, 25Δ RR, 25Δ BF) fully parameterise the smile.",
  },
];
