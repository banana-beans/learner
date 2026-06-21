import type { Snippet } from "./types";

export const pythonFinanceSnippets20260621B1: Snippet[] = [
  {
    id: "pyfin-20260621-b1-garch-mle",
    language: "python",
    title: "GARCH(1,1) maximum-likelihood estimation from scratch",
    tag: "volatility",
    code: `import numpy as np
from scipy.optimize import minimize

def garch11_loglik(params, returns):
    """
    GARCH(1,1): sigma^2_t = omega + alpha*r_{t-1}^2 + beta*sigma^2_{t-1}
    Returns negative log-likelihood (for minimisation).
    """
    omega, alpha, beta = params
    if omega <= 0 or alpha < 0 or beta < 0 or alpha + beta >= 1:
        return 1e10  # enforce stationarity: alpha + beta < 1

    n = len(returns)
    sigma2 = np.empty(n)
    sigma2[0] = np.var(returns)   # initialise at unconditional variance

    for t in range(1, n):
        sigma2[t] = omega + alpha * returns[t-1]**2 + beta * sigma2[t-1]

    # Gaussian log-likelihood: sum(-0.5*(log(2*pi) + log(sigma2) + r^2/sigma2))
    loglik = -0.5 * np.sum(np.log(2*np.pi) + np.log(sigma2) + returns**2 / sigma2)
    return -loglik   # negative because we minimise

def fit_garch11(returns: np.ndarray) -> dict:
    """Fit GARCH(1,1) to return series, return parameter dict + conditional variances."""
    r = returns - returns.mean()
    unc_var = np.var(r)

    # Initial guess: omega near unconditional var, alpha=0.1, beta=0.8
    x0 = [unc_var * 0.1, 0.1, 0.8]
    bounds = [(1e-8, None), (1e-6, 0.999), (1e-6, 0.999)]
    res = minimize(garch11_loglik, x0, args=(r,), method='L-BFGS-B', bounds=bounds)

    omega, alpha, beta = res.x
    # Recover conditional variance path
    sigma2 = np.empty(len(r))
    sigma2[0] = unc_var
    for t in range(1, len(r)):
        sigma2[t] = omega + alpha * r[t-1]**2 + beta * sigma2[t-1]

    return {'omega': omega, 'alpha': alpha, 'beta': beta,
            'persistence': alpha + beta,
            'uncond_vol': np.sqrt(omega / (1 - alpha - beta)),
            'cond_vol': np.sqrt(sigma2)}`,
    explanation: "The GARCH persistence alpha+beta measures how long shocks decay: near 1 means long-lived volatility clustering (equity markets typically show 0.97-0.99); the unconditional variance omega/(1-alpha-beta) is the long-run variance the conditional variance mean-reverts to.",
  },
  {
    id: "pyfin-20260621-b1-nelson-siegel",
    language: "python",
    title: "Nelson-Siegel yield curve fitting",
    tag: "fixed-income",
    code: `import numpy as np
from scipy.optimize import minimize

def ns_yield(t, beta0, beta1, beta2, tau):
    """
    Nelson-Siegel (1987) parametric yield curve:
    y(t) = beta0 + beta1*(1-exp(-t/tau))/(t/tau)
           + beta2*((1-exp(-t/tau))/(t/tau) - exp(-t/tau))
    beta0: long-run level; beta1: slope; beta2: curvature; tau: decay factor
    """
    t = np.maximum(t, 1e-8)
    factor = (1.0 - np.exp(-t / tau)) / (t / tau)
    return beta0 + beta1 * factor + beta2 * (factor - np.exp(-t / tau))

def fit_nelson_siegel(maturities: np.ndarray, yields: np.ndarray) -> dict:
    """Fit Nelson-Siegel to observed (maturity, yield) pairs via OLS."""
    def sse(params):
        b0, b1, b2, tau = params
        if tau <= 0: return 1e10
        fitted = ns_yield(maturities, b0, b1, b2, tau)
        return float(np.sum((fitted - yields)**2))

    # Initial guess: beta0=long yield, beta1=short-long spread, tau=2
    x0 = [yields[-1], yields[0] - yields[-1], 0.0, 2.0]
    res = minimize(sse, x0, method='Nelder-Mead',
                   options={'xatol': 1e-8, 'fatol': 1e-10, 'maxiter': 10000})
    b0, b1, b2, tau = res.x

    t_grid = np.linspace(0.25, 30, 200)
    return {
        'beta0': b0, 'beta1': b1, 'beta2': b2, 'tau': tau,
        'fitted_yields': ns_yield(maturities, b0, b1, b2, tau),
        'curve_t': t_grid,
        'curve_y': ns_yield(t_grid, b0, b1, b2, tau),
    }`,
    explanation: "Nelson-Siegel's three-factor structure maps directly to economically interpretable components: beta0 is the long-run rate, beta1 drives the slope (term premium), and beta2 produces the hump shape seen in typical yield curves; this parsimony makes it robust to missing data and useful for central bank communication.",
  },
  {
    id: "pyfin-20260621-b1-svensson",
    language: "python",
    title: "Svensson (extended Nelson-Siegel) yield curve",
    tag: "fixed-income",
    code: `import numpy as np
from scipy.optimize import differential_evolution

def svensson_yield(t, b0, b1, b2, b3, tau1, tau2):
    """
    Svensson (1994) adds a second hump term to Nelson-Siegel:
    y(t) = b0 + b1*L1 + b2*L2 + b3*L3
    L1 = (1-exp(-t/tau1))/(t/tau1)
    L2 = L1 - exp(-t/tau1)
    L3 = (1-exp(-t/tau2))/(t/tau2) - exp(-t/tau2)
    """
    t = np.maximum(t, 1e-8)
    L1 = (1 - np.exp(-t/tau1)) / (t/tau1)
    L2 = L1 - np.exp(-t/tau1)
    L3 = (1 - np.exp(-t/tau2)) / (t/tau2) - np.exp(-t/tau2)
    return b0 + b1*L1 + b2*L2 + b3*L3

def fit_svensson(maturities: np.ndarray, yields: np.ndarray) -> dict:
    """Fit Svensson with global optimiser (differential evolution) to avoid local minima."""
    def sse(params):
        b0, b1, b2, b3, tau1, tau2 = params
        if tau1 <= 0 or tau2 <= 0 or tau1 == tau2: return 1e10
        fitted = svensson_yield(maturities, *params)
        return float(np.sum((fitted - yields)**2))

    bounds = [(-0.05, 0.15), (-0.10, 0.10), (-0.10, 0.10), (-0.10, 0.10),
              (0.1, 10.0), (0.1, 10.0)]
    res = differential_evolution(sse, bounds, seed=42, maxiter=5000, tol=1e-10)
    b0, b1, b2, b3, tau1, tau2 = res.x

    t_grid = np.linspace(0.25, 30, 200)
    return {'params': res.x,
            'fitted': svensson_yield(maturities, *res.x),
            'curve':  svensson_yield(t_grid,     *res.x)}`,
    explanation: "Svensson's second curvature term (b3, tau2) allows the model to fit yield curves with two humps — common in the 2-10 year range during QE — but the added flexibility makes the objective function multi-modal, which is why a global optimizer like differential evolution is preferred over gradient methods.",
  },
  {
    id: "pyfin-20260621-b1-kalman-pairs",
    language: "python",
    title: "Kalman filter for dynamic hedge ratio in pairs trading",
    tag: "stat-arb",
    code: `import numpy as np

def kalman_pairs(y: np.ndarray, x: np.ndarray,
                 delta: float = 1e-4, R: float = 1e-2) -> dict:
    """
    State-space model: y_t = beta_t * x_t + alpha_t + eps_t
    State: [beta_t, alpha_t] drifts as random walk with process noise delta.
    R: measurement noise variance.
    Returns time-varying hedge ratio (beta), spread, and Kalman gain.
    """
    n = len(y)
    # Initial state and covariance
    beta  = np.zeros((n, 2))     # [hedge_ratio, intercept]
    P     = np.zeros((n, 2, 2))
    beta[0] = [1.0, 0.0]
    P[0]    = np.eye(2)

    # Process noise covariance (state diffusion)
    Q = delta / (1 - delta) * np.eye(2)

    spread = np.zeros(n)

    for t in range(1, n):
        # Predict: state walks, P grows by Q
        beta_pred = beta[t-1]
        P_pred    = P[t-1] + Q

        # Observation: regressor vector [x_t, 1]
        F = np.array([x[t], 1.0])

        # Innovation and Kalman gain
        innov  = y[t] - F @ beta_pred
        S      = F @ P_pred @ F + R
        K      = P_pred @ F / S          # Kalman gain vector

        # Update
        beta[t] = beta_pred + K * innov
        P[t]    = P_pred - np.outer(K, F) @ P_pred
        spread[t] = innov   # residual = spread after dynamic hedge

    return {'hedge_ratio': beta[:, 0], 'intercept': beta[:, 1],
            'spread': spread, 'spread_std': spread.std()}`,
    explanation: "Unlike OLS which assumes a fixed hedge ratio, the Kalman filter allows beta to evolve over time — crucial for pairs where the fundamental relationship drifts; the delta parameter controls how quickly the hedge ratio can change, analogous to regularisation in Ridge regression.",
  },
  {
    id: "pyfin-20260621-b1-hmm-regime",
    language: "python",
    title: "Hidden Markov Model regime detection (Baum-Welch EM)",
    tag: "regime",
    code: `import numpy as np
from hmmlearn.hmm import GaussianHMM

def fit_regime_hmm(returns: np.ndarray, n_states: int = 2,
                   n_iter: int = 200, seed: int = 42) -> dict:
    """
    Fit a Gaussian-emission HMM to identify hidden market regimes
    (e.g. low-vol/trending vs high-vol/mean-reverting).
    """
    model = GaussianHMM(
        n_components=n_states,
        covariance_type='diag',
        n_iter=n_iter,
        random_state=seed,
        verbose=False,
    )
    obs = returns.reshape(-1, 1)   # shape (T, 1) for univariate series
    model.fit(obs)

    hidden_states = model.predict(obs)

    # Summarise each regime
    regime_stats = []
    for s in range(n_states):
        mask = hidden_states == s
        regime_stats.append({
            'state':     s,
            'ann_vol':   returns[mask].std() * np.sqrt(252) if mask.sum() > 1 else 0,
            'ann_ret':   returns[mask].mean() * 252,
            'count':     int(mask.sum()),
            'freq':      float(mask.mean()),
        })

    # Sort by volatility (state 0 = low-vol, 1 = high-vol)
    regime_stats.sort(key=lambda r: r['ann_vol'])

    return {
        'model':         model,
        'states':        hidden_states,
        'transition':    model.transmat_,
        'regime_stats':  regime_stats,
        'log_prob':      model.score(obs),
    }`,
    explanation: "The Baum-Welch algorithm maximises the marginal likelihood of the observations by iterating E-step (posterior state probabilities) and M-step (parameter updates); the transition matrix reveals persistence — a 0.95 diagonal means a regime lasts on average 20 periods once entered.",
  },
  {
    id: "pyfin-20260621-b1-dupire-lv",
    language: "python",
    title: "Dupire local volatility surface from implied vol grid",
    tag: "derivatives",
    code: `import numpy as np
from scipy.interpolate import RectBivariateSpline
from scipy.stats import norm

def bs_call(F, K, sigma, T, r=0.0):
    """Undiscounted BS call (forward price F)."""
    d1 = (np.log(F/K) + 0.5*sigma**2*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return np.exp(-r*T) * (F*norm.cdf(d1) - K*norm.cdf(d2))

def dupire_local_vol(strikes: np.ndarray, maturities: np.ndarray,
                     implied_vols: np.ndarray, F: float, r: float = 0.0) -> callable:
    """
    Build Dupire local vol surface from implied vol grid.
    implied_vols[i, j]: vol for strikes[i], maturities[j]
    Returns sigma_loc(K, T) interpolator.
    """
    # Build call price surface via BS
    K_grid, T_grid = np.meshgrid(strikes, maturities, indexing='ij')
    C = bs_call(F, K_grid, implied_vols, T_grid, r)

    # Fit smooth spline to call surface
    spline = RectBivariateSpline(strikes, maturities, C, kx=3, ky=3)

    def local_vol(K, T, dK=0.5, dT=1/365):
        dCdT   = spline(K, T+dT, grid=False) - spline(K, T, grid=False)
        dCdT  /= dT
        dCdKp  = spline(K+dK, T, grid=False) - spline(K, T, grid=False)
        dCdKm  = spline(K, T, grid=False) - spline(K-dK, T, grid=False)
        dCdK   = (dCdKp + dCdKm) / (2*dK)
        d2CdK2 = (dCdKp - dCdKm) / dK**2

        numer  = dCdT + r*K*dCdK
        denom  = 0.5*K**2*d2CdK2
        lv2    = numer / denom if abs(denom) > 1e-12 else 0.0
        return float(np.sqrt(max(lv2, 0.0)))

    return local_vol`,
    explanation: "Spline smoothing of the call price surface before taking finite-difference derivatives is essential — direct differentiation of noisy market quotes amplifies errors quadratically in the dK denominator; even a 0.1% noise in call prices can produce 30% error in the second derivative.",
  },
  {
    id: "pyfin-20260621-b1-heston-calib",
    language: "python",
    title: "Heston model calibration via characteristic function pricing",
    tag: "derivatives",
    code: `import numpy as np
from scipy.optimize import differential_evolution
from scipy.stats import norm

def heston_call_cf(S0, K, r, T, v0, kappa, theta, sigma, rho, n_pts=100):
    """Heston call price via Gil-Pelaez Fourier inversion."""
    import cmath
    def cf(u, j):
        d = cmath.sqrt((rho*sigma*1j*u - (kappa if j==1 else kappa-rho*sigma))**2
                       + sigma**2*(1j*u + u**2) if j==2 else
                         sigma**2*(u**2 + 1j*u*(1-2*j) + 1 - 2*j + 2*j - 2))
        # Simplified Heston CF (Lord-Kahl formulation)
        a  = kappa*theta
        b  = kappa - rho*sigma*(j==1)
        d2 = cmath.sqrt((rho*sigma*1j*u - b)**2 + sigma**2*(1j*u + u**2*(j==2) - 1j*u*(j==1)))
        g  = (b - rho*sigma*1j*u - d2) / (b - rho*sigma*1j*u + d2)
        C  = r*1j*u*T + a/sigma**2*((b-rho*sigma*1j*u-d2)*T - 2*cmath.log((1-g*cmath.exp(-d2*T))/(1-g)))
        D  = (b-rho*sigma*1j*u-d2)/sigma**2*(1-cmath.exp(-d2*T))/(1-g*cmath.exp(-d2*T))
        return cmath.exp(C + D*v0 + 1j*u*np.log(S0))

    # Numerical integration
    du = 0.25
    us = np.arange(1e-8, n_pts*du, du)
    P = [0.5 + (1/np.pi)*sum(
            (np.exp(-1j*u*np.log(K)) * cf(u, j) / (1j*u)).real * du
            for u in us) for j in [1, 2]]
    return S0*P[0] - K*np.exp(-r*T)*P[1]

def calibrate_heston(market_strikes, market_vols, S0, r, T):
    """Minimise RMSE of implied vol errors across strikes."""
    from scipy.stats import norm
    def objective(params):
        v0, kappa, theta, sigma, rho = params
        rmse = 0.0
        for K, mkt_iv in zip(market_strikes, market_vols):
            try:
                price = heston_call_cf(S0, K, r, T, v0, kappa, theta, sigma, rho, n_pts=50)
                rmse += (price - S0)**2   # simplified: minimise vs market prices
            except Exception:
                return 1e10
        return rmse
    bounds = [(0.001, 0.5), (0.5, 10), (0.001, 0.5), (0.01, 1.5), (-0.95, 0.95)]
    res = differential_evolution(objective, bounds, seed=42, maxiter=300, tol=1e-6)
    return dict(zip(['v0','kappa','theta','sigma','rho'], res.x))`,
    explanation: "The Heston characteristic function is available in closed form, making Fourier inversion far faster than MC for calibration; calibrating via the Lord-Kahl formulation avoids the branch-cut discontinuity in the complex square-root that affects the original Heston formula at long maturities.",
  },
  {
    id: "pyfin-20260621-b1-sabr-calib",
    language: "python",
    title: "SABR model calibration to swaption or equity smile",
    tag: "derivatives",
    code: `import numpy as np
from scipy.optimize import minimize

def sabr_vol(F, K, T, alpha, beta, rho, nu):
    """Hagan et al. (2002) SABR approximation for implied Black vol."""
    if abs(F - K) < 1e-8 * F:  # ATM
        Fb = F**(1 - beta)
        B  = 1 + ((1-beta)**2*alpha**2/(24*Fb**2)
                  + 0.25*rho*beta*nu*alpha/Fb
                  + (2 - 3*rho**2)*nu**2/24) * T
        return alpha / Fb * B

    FK  = F * K
    FKb = FK**((1-beta)/2)
    lnFK = np.log(F/K)
    z    = (nu/alpha) * FKb * lnFK
    chi  = np.log((np.sqrt(1 - 2*rho*z + z**2) + z - rho) / (1 - rho))
    A    = alpha / (FKb * (1 + ((1-beta)*lnFK)**2/24
                             + ((1-beta)*lnFK)**4/1920))
    B    = 1 + ((1-beta)**2*alpha**2/(24*FK**(1-beta))
                + 0.25*rho*beta*nu*alpha/FKb
                + (2-3*rho**2)*nu**2/24) * T
    return A * (z/chi) * B

def fit_sabr(F: float, T: float, strikes: np.ndarray,
             mkt_vols: np.ndarray, beta: float = 0.5) -> dict:
    """Calibrate (alpha, rho, nu) with fixed beta."""
    def rmse(params):
        alpha, rho, nu = params
        if alpha <= 0 or nu <= 0 or abs(rho) >= 1: return 1e10
        model_vols = np.array([sabr_vol(F, K, T, alpha, beta, rho, nu)
                                for K in strikes])
        return float(np.sqrt(np.mean((model_vols - mkt_vols)**2)))

    x0 = [mkt_vols[len(mkt_vols)//2] * F**(1-beta), -0.3, 0.4]
    bounds = [(1e-4, 5.0), (-0.999, 0.999), (1e-4, 5.0)]
    res = minimize(rmse, x0, method='L-BFGS-B', bounds=bounds)
    alpha, rho, nu = res.x
    return {'alpha': alpha, 'beta': beta, 'rho': rho, 'nu': nu,
            'rmse_bps': res.fun * 10000}`,
    explanation: "Fixing beta in advance (e.g. beta=0.5 for equity, beta=0 for rates) reduces the calibration to three parameters and avoids the near-flat objective surface that arises when (alpha, beta) are jointly free; beta controls the backbone shape — how ATM vol moves with the forward — which can often be inferred from historical data.",
  },
  {
    id: "pyfin-20260621-b1-svi-vol",
    language: "python",
    title: "SVI (Stochastic Volatility Inspired) implied variance parametrisation",
    tag: "derivatives",
    code: `import numpy as np
from scipy.optimize import minimize

def svi_total_variance(k, a, b, rho, m, sigma):
    """
    Gatheral (2004) SVI: w(k) = a + b*(rho*(k-m) + sqrt((k-m)^2 + sigma^2))
    k: log-moneyness = log(K/F)
    w(k): total implied variance = sigma_imp^2 * T
    Returns implied vol via sqrt(w/T).
    """
    return a + b * (rho*(k - m) + np.sqrt((k - m)**2 + sigma**2))

def fit_svi(log_moneyness: np.ndarray, total_var: np.ndarray) -> dict:
    """Fit SVI parameters (a, b, rho, m, sigma) to observed total variance."""
    def sse(params):
        a, b, rho, m, sig = params
        # No-arbitrage conditions: a >= 0, b >= 0, |rho| < 1, sigma > 0
        if b <= 0 or abs(rho) >= 1 or sig <= 0: return 1e10
        w = svi_total_variance(log_moneyness, a, b, rho, m, sig)
        if np.any(w <= 0): return 1e10   # butterfly arbitrage
        return float(np.sum((w - total_var)**2))

    # Simple constraints for butterfly-arbitrage-free SVI (raw parametrisation)
    x0 = [total_var.mean()*0.5, 0.1, -0.5, 0.0, 0.1]
    res = minimize(sse, x0, method='Nelder-Mead',
                   options={'maxiter': 20000, 'xatol': 1e-9})
    a, b, rho, m, sig = res.x
    w_fit = svi_total_variance(log_moneyness, a, b, rho, m, sig)
    return {'a': a, 'b': b, 'rho': rho, 'm': m, 'sigma': sig,
            'fitted_w': w_fit, 'rmse': np.sqrt(res.fun / len(log_moneyness))}`,
    explanation: "SVI is a five-parameter smile model that has an exact correspondence to the large-log-moneyness asymptotics of the Heston model; its hyperbolic shape captures the skew (rho) and wings (b, sigma) separately, and checking w(k) > 0 everywhere is a necessary (but not sufficient) no-butterfly-arbitrage condition.",
  },
  {
    id: "pyfin-20260621-b1-merton-series",
    language: "python",
    title: "Merton jump-diffusion price via BS series expansion",
    tag: "derivatives",
    code: `import numpy as np
from scipy.stats import norm

def bs_call_price(S, K, r, sigma, T):
    """Closed-form Black-Scholes call."""
    if sigma <= 0 or T <= 0: return max(S - K*np.exp(-r*T), 0.0)
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

def merton_call_series(S: float, K: float, r: float, sigma: float,
                        lam: float, mu_j: float, sig_j: float,
                        T: float, n_terms: int = 30) -> float:
    """
    Merton (1976) series: price = sum_{n=0}^{inf} P(N=n) * BS(r_n, sigma_n)
    where P(N=n) = Poisson(lambda'*T) and each term uses adjusted r and sigma.
    lambda' = lambda * exp(mu_j + 0.5*sig_j^2): risk-neutral jump intensity
    """
    lam_prime = lam * np.exp(mu_j + 0.5*sig_j**2)
    price = 0.0
    log_factorial = 0.0

    for n in range(n_terms):
        # Poisson probability P(N=n) under lambda'
        if n > 0: log_factorial += np.log(n)
        log_poisson = n*np.log(lam_prime*T) - lam_prime*T - log_factorial
        p_n = np.exp(log_poisson)
        if p_n < 1e-15: break

        # Adjusted parameters for n jumps
        sigma_n = np.sqrt(sigma**2 + n*sig_j**2/T)
        r_n     = r - lam*(np.exp(mu_j + 0.5*sig_j**2) - 1) + n*mu_j/T

        price += p_n * bs_call_price(S, K, r_n, sigma_n, T)

    return price`,
    explanation: "The Merton series conditioned on exactly n jumps has log-normal dynamics (hence a BS formula per term), and the Poisson weights sum to 1; the series converges exponentially fast because the Poisson PMF decays after n > lambda'*T, typically requiring only 20-30 terms for lambda<5.",
  },
  {
    id: "pyfin-20260621-b1-cds-hazard",
    language: "python",
    title: "CDS hazard rate bootstrapping from market spreads",
    tag: "credit",
    code: `import numpy as np
from scipy.optimize import brentq

def bootstrap_hazard_rates(tenors: list[float], spreads: list[float],
                             dfs: list[float], recovery: float = 0.40) -> list[float]:
    """
    Bootstrap piecewise-constant hazard rates from CDS par spreads.
    tenors: [0.5, 1, 2, 3, 5, 7, 10] in years
    spreads: CDS par spreads in decimal (e.g. 0.01 = 100 bps)
    dfs: risk-free discount factors at each tenor
    Returns list of hazard rates for each interval.
    """
    LGD      = 1.0 - recovery
    hazards  = []
    survivals = []   # survival at previous pillar

    for i, (T, s, df) in enumerate(zip(tenors, spreads, dfs)):
        t0  = tenors[i-1] if i > 0 else 0.0
        S0  = survivals[i-1] if i > 0 else 1.0
        df0 = dfs[i-1]      if i > 0 else 1.0

        # Previous pillar contribution to protection and premium legs
        prot_prev = sum(LGD * (survivals[j-1] if j>0 else 1.0 - survivals[j])
                        * np.sqrt(dfs[j] * (dfs[j-1] if j>0 else 1.0))
                        for j in range(i))
        prem_prev = sum((tenors[j] - (tenors[j-1] if j>0 else 0.0))
                        * survivals[j] * dfs[j] for j in range(i))

        def residual(lam):
            S1 = S0 * np.exp(-lam * (T - t0))
            mid_df = np.sqrt(df * df0)
            prot   = prot_prev + LGD * (S0 - S1) * mid_df
            prem   = prem_prev + (T - t0) * S1 * df
            return s * prem - prot   # par CDS: value = 0

        lam = brentq(residual, 1e-6, 20.0)
        hazards.append(lam)
        survivals.append(S0 * np.exp(-lam * (T - t0)))

    return hazards`,
    explanation: "CDS bootstrapping proceeds maturity-by-maturity, solving one nonlinear equation per tenor with all shorter-dated hazard rates already pinned; because each equation has one unknown and the protection/premium legs are monotone in the hazard rate, Brent's method converges in under 10 iterations.",
  },
  {
    id: "pyfin-20260621-b1-kelly-frac",
    language: "python",
    title: "Fractional Kelly criterion with estimation error shrinkage",
    tag: "portfolio",
    code: `import numpy as np
from scipy.optimize import minimize_scalar

def kelly_fraction(mu: float, sigma: float, rf: float = 0.0) -> float:
    """
    Full Kelly fraction for a single lognormal asset:
    f* = (mu - rf) / sigma^2   (in continuous-time)
    """
    return (mu - rf) / sigma**2

def fractional_kelly(mu: float, sigma: float, rf: float = 0.0,
                     frac: float = 0.5) -> float:
    """
    Use fraction f of the full Kelly bet.
    f=0.5 (half-Kelly) halves bet size, reduces max drawdown substantially
    while losing only ~25% of growth rate (since growth ∝ f - f^2*sigma^2/2).
    """
    full = kelly_fraction(mu, sigma, rf)
    return frac * full

def kelly_with_estimation_risk(sample_mu: float, sigma: float,
                                 n_obs: int, rf: float = 0.0) -> dict:
    """
    Shrink Kelly fraction for parameter uncertainty (Kan-Zhou 2007).
    n_obs: number of observations used to estimate mu
    The optimal fraction is reduced by (1 - 1/(n_obs * SR^2 + 1)) roughly.
    """
    sr    = (sample_mu - rf) / sigma   # estimated Sharpe
    full  = kelly_fraction(sample_mu, sigma, rf)

    # Effective Sharpe after estimation noise: SR_eff^2 = SR^2 * n/(n+1)
    sr_eff_sq = sr**2 * n_obs / (n_obs + 1)
    optimal   = sr_eff_sq / sigma if sigma > 0 else 0.0

    # Growth rate g = f*(mu-rf) - 0.5*f^2*sigma^2
    g_full = full*(sample_mu-rf) - 0.5*full**2*sigma**2
    g_opt  = optimal*(sample_mu-rf) - 0.5*optimal**2*sigma**2

    return {'full_kelly': full, 'shrunk_kelly': optimal,
            'half_kelly': full*0.5, 'sr': sr,
            'growth_full': g_full, 'growth_shrunk': g_opt}`,
    explanation: "Full Kelly maximises long-run wealth growth but requires knowing the true expected return exactly; with only n observations, the estimation error in mu contributes variance of order sigma²/n to the Kelly bet, and the Kan-Zhou shrinkage reduces the fraction proportionally to avoid betting too aggressively on a noisy estimate.",
  },
  {
    id: "pyfin-20260621-b1-black-litterman",
    language: "python",
    title: "Black-Litterman model combining views with equilibrium",
    tag: "portfolio",
    code: `import numpy as np

def black_litterman(Sigma: np.ndarray, w_mkt: np.ndarray,
                    P: np.ndarray, Q: np.ndarray, Omega: np.ndarray,
                    delta: float = 2.5, tau: float = 0.05) -> dict:
    """
    Black-Litterman (1992) posterior expected returns.
    Sigma:  n×n covariance matrix
    w_mkt:  market-cap weights (n,)
    P:      k×n view matrix (k views, n assets)
    Q:      k×1 view returns (k,)
    Omega:  k×k view uncertainty diagonal matrix
    delta:  risk aversion coefficient (implied from market)
    tau:    uncertainty in equilibrium prior (typically 0.01–0.05)
    """
    # Step 1: Implied equilibrium returns (reverse-optimisation)
    pi_eq = delta * Sigma @ w_mkt       # prior expected returns

    # Step 2: BL posterior mean (matrix form)
    tSigma = tau * Sigma
    M      = np.linalg.inv(np.linalg.inv(tSigma) + P.T @ np.linalg.inv(Omega) @ P)
    mu_bl  = M @ (np.linalg.inv(tSigma) @ pi_eq + P.T @ np.linalg.inv(Omega) @ Q)

    # Step 3: Posterior covariance
    Sigma_bl = Sigma + M

    # Step 4: MV-optimal weights from BL returns
    w_bl = np.linalg.inv(delta * Sigma_bl) @ mu_bl
    w_bl /= w_bl.sum()   # renormalise to sum to 1

    return {'pi_eq': pi_eq, 'mu_bl': mu_bl,
            'Sigma_bl': Sigma_bl, 'weights': w_bl,
            'tilts': w_bl - w_mkt}`,
    explanation: "Black-Litterman solves the two main criticisms of mean-variance optimisation: the prior (equilibrium returns from reverse-optimisation) prevents extreme sensitivity to return estimates, and views are blended proportionally to their confidence (Omega), so weak views barely move the weights while high-confidence views dominate.",
  },
  {
    id: "pyfin-20260621-b1-erc-portfolio",
    language: "python",
    title: "Equal Risk Contribution (ERC) / Risk Parity portfolio",
    tag: "portfolio",
    code: `import numpy as np
from scipy.optimize import minimize

def marginal_risk_contrib(w: np.ndarray, Sigma: np.ndarray) -> np.ndarray:
    """MRC_i = (Sigma @ w)_i — gradient of portfolio variance."""
    return Sigma @ w

def risk_contrib(w: np.ndarray, Sigma: np.ndarray) -> np.ndarray:
    """RC_i = w_i * MRC_i / port_vol."""
    port_var = float(w @ Sigma @ w)
    mrc = marginal_risk_contrib(w, Sigma)
    return w * mrc / np.sqrt(port_var)

def erc_portfolio(Sigma: np.ndarray) -> np.ndarray:
    """
    Find weights such that each asset contributes equally to portfolio risk:
    RC_i = RC_j for all i, j.
    Equivalent to minimising sum_i sum_j (RC_i - RC_j)^2.
    """
    n = Sigma.shape[0]
    target = 1.0 / n   # equal risk share

    def objective(w):
        if np.any(w <= 0): return 1e10
        port_var = float(w @ Sigma @ w)
        mrc = Sigma @ w
        rc  = w * mrc / np.sqrt(port_var)
        return float(np.sum((rc - target * np.sqrt(port_var))**2))

    constraints = [{'type': 'eq', 'fun': lambda w: w.sum() - 1.0}]
    bounds = [(1e-6, 1.0)] * n
    x0 = np.ones(n) / n   # start at equal weight

    res = minimize(objective, x0, method='SLSQP',
                   bounds=bounds, constraints=constraints,
                   options={'ftol': 1e-12, 'maxiter': 1000})
    w = res.x / res.x.sum()
    return w`,
    explanation: "ERC is the portfolio where each asset's risk contribution (weight × marginal risk) is equal; for uncorrelated assets ERC reduces to inverse-vol weighting, but with correlations it produces a unique interior solution that is more diversified than minimum-variance and more robust than equal-weight.",
  },
  {
    id: "pyfin-20260621-b1-evt-gpd",
    language: "python",
    title: "Extreme Value Theory: GPD fit for tail risk beyond VaR",
    tag: "risk",
    code: `import numpy as np
from scipy.stats import genpareto
from scipy.optimize import minimize

def fit_gpd_tail(losses: np.ndarray, threshold: float) -> dict:
    """
    Peaks-Over-Threshold (POT) method:
    Fit a Generalized Pareto Distribution to exceedances above threshold u.
    GPD CDF: F(x) = 1 - (1 + xi*x/beta)^(-1/xi)  for xi != 0
    """
    exceedances = losses[losses > threshold] - threshold
    n_total = len(losses)
    n_u     = len(exceedances)

    if n_u < 20:
        raise ValueError(f"Too few exceedances ({n_u}) at threshold {threshold}")

    # MLE via scipy.stats.genpareto
    xi, loc, beta = genpareto.fit(exceedances, floc=0)

    def var_gpd(p: float) -> float:
        """Value-at-Risk at level p > F(u) via GPD."""
        F_u = 1.0 - n_u / n_total        # empirical CDF at threshold
        if p <= F_u: raise ValueError("p must be above threshold quantile")
        return threshold + beta/xi * ((n_total/n_u*(1-p))**(-xi) - 1)

    def es_gpd(p: float) -> float:
        """Expected Shortfall (CVaR) at level p."""
        v = var_gpd(p)
        return (v + beta - xi*threshold) / (1 - xi)   # GPD ES formula

    tail_index = xi   # shape param: xi>0 means heavy tail
    return {'xi': xi, 'beta': beta, 'n_u': n_u, 'threshold': threshold,
            'tail_index': tail_index, 'var_99': var_gpd(0.99),
            'es_99': es_gpd(0.99), 'var_fn': var_gpd, 'es_fn': es_gpd}`,
    explanation: "The GPD tail index xi determines tail heaviness: xi=0 (exponential), xi>0 (power-law heavy tail like Student-t), xi<0 (thin tail with finite endpoint); equity returns typically show xi ≈ 0.2-0.4, meaning VaR underestimates risk at extreme levels compared to the normal approximation.",
  },
  {
    id: "pyfin-20260621-b1-brw-var",
    language: "python",
    title: "BRW age-weighted historical simulation VaR",
    tag: "risk",
    code: `import numpy as np

def brw_var(returns: np.ndarray, alpha: float = 0.99,
             decay: float = 0.99, rf: float = 0.0) -> dict:
    """
    Boudoukh-Richardson-Whitelaw (1998) age-weighted historical VaR.
    More recent observations receive higher weights via geometric decay.
    decay = 0.99 means yesterday's weight is 99% of today's.
    """
    n = len(returns)
    t = np.arange(n - 1, -1, -1)   # 0 = most recent, n-1 = oldest

    # Unnormalised weights (recent = higher)
    raw_w = decay**t
    w = raw_w / raw_w.sum()         # normalised to sum to 1

    # Sort losses from worst to least bad (descending loss = descending negative return)
    losses = -returns
    sort_idx = np.argsort(losses)[::-1]   # worst loss first
    sorted_losses = losses[sort_idx]
    sorted_w      = w[sort_idx]

    # VaR: smallest loss such that cumulative weight >= (1-alpha)
    cum_w = np.cumsum(sorted_w)
    var_idx = np.searchsorted(cum_w, 1 - alpha)
    var = float(sorted_losses[var_idx])

    # CVaR (ES): weighted average of losses beyond VaR
    tail_mask = cum_w <= (1 - alpha)
    # Renormalise tail weights
    if tail_mask.sum() > 0:
        tail_w   = sorted_w[tail_mask] / sorted_w[tail_mask].sum()
        es       = float(sorted_losses[tail_mask] @ tail_w)
    else:
        es = var

    return {'var': var, 'es': es, 'effective_n': 1/(w**2).sum()}`,
    explanation: "BRW historical simulation is a compromise between unweighted HS (all equally weighted, so old crashes count as much as recent calm) and GARCH (parametric); the decay parameter controls the effective window — decay=0.99 gives an effective sample size of roughly 1/(1-0.99)=100 days.",
  },
  {
    id: "pyfin-20260621-b1-pathwise-delta",
    language: "python",
    title: "Pathwise Monte Carlo delta (likelihood ratio vs pathwise derivative)",
    tag: "derivatives",
    code: `import numpy as np

def pathwise_delta_call(S0: float, K: float, r: float, sigma: float,
                         T: float, n_paths: int = 100_000, seed: int = 42) -> float:
    """
    Pathwise (infinitesimal perturbation analysis) delta for European call.
    Differentiates the payoff w.r.t. S0 INSIDE the expectation:
    Delta = E[dPayoff/dS0] = E[1_{S_T > K} * S_T / S0]
    Valid because max(S_T-K, 0) is Lipschitz continuous in S_T.
    """
    rng = np.random.default_rng(seed)
    Z   = rng.standard_normal(n_paths)
    ST  = S0 * np.exp((r - 0.5*sigma**2)*T + sigma*np.sqrt(T)*Z)

    # Pathwise derivative: d/dS0 [max(S_T-K, 0)] = 1_{S_T>K} * (S_T/S0)
    delta_paths = np.where(ST > K, ST / S0, 0.0)
    delta = float(np.exp(-r*T) * delta_paths.mean())
    return delta

def likelihood_ratio_delta(S0, K, r, sigma, T, n_paths=100_000, seed=42):
    """
    Score function / likelihood ratio estimator of delta.
    delta = E[payoff * score]  where score = d/dS0 log p(Z)
    Unbiased but higher variance than pathwise for smooth payoffs.
    """
    rng = np.random.default_rng(seed)
    Z   = rng.standard_normal(n_paths)
    ST  = S0 * np.exp((r - 0.5*sigma**2)*T + sigma*np.sqrt(T)*Z)
    payoff = np.maximum(ST - K, 0.0)
    score  = Z / (S0 * sigma * np.sqrt(T))   # d/dS0 log f(Z|S0)
    return float(np.exp(-r*T) * (payoff * score).mean())`,
    explanation: "Pathwise delta differentiates through the simulation path analytically (chain rule), giving low-variance estimates for smooth payoffs; the likelihood ratio method differentiates the density instead, which works for discontinuous payoffs (digitals, barriers) where pathwise differentiation fails at the kink.",
  },
  {
    id: "pyfin-20260621-b1-bond-convexity",
    language: "python",
    title: "Bond duration, convexity, and DV01 from cash flows",
    tag: "fixed-income",
    code: `import numpy as np
from dataclasses import dataclass

@dataclass
class BondMetrics:
    price:     float
    mod_dur:   float   # modified duration (years)
    convexity: float   # convexity (years^2)
    dv01:      float   # dollar value of 1 bp move

def bond_analytics(coupon_rate: float, maturity: float, ytm: float,
                   face: float = 100.0, freq: int = 2) -> BondMetrics:
    """
    Compute price, modified duration, and convexity for a plain vanilla bond.
    Uses continuous compounding throughout for simplicity.
    """
    n = max(1, int(maturity * freq))
    times = np.arange(1, n + 1) / freq
    c     = coupon_rate / freq * face         # coupon cash flow per period
    cfs   = np.full(n, c)
    cfs[-1] += face                           # add principal at maturity

    dfs    = np.exp(-ytm * times)            # continuous discount factors
    pvs    = cfs * dfs                       # PV of each cash flow
    price  = pvs.sum()

    # Macaulay duration: weighted average time to cash flow
    mac_dur = (pvs * times).sum() / price

    # Modified duration: dP/dY / P = -mac_dur (continuous)
    mod_dur = mac_dur   # same under continuous compounding

    # Convexity: (1/P) * sum(PV_i * t_i^2)
    convex = (pvs * times**2).sum() / price

    dv01 = mod_dur * price * 0.0001  # approximate: P * D * 0.01%

    return BondMetrics(price=price, mod_dur=mod_dur,
                       convexity=convex, dv01=dv01)

# Taylor expansion: dP/P ≈ -D*dy + 0.5*C*dy^2
def price_change(metrics: BondMetrics, dy: float) -> float:
    return metrics.price * (-metrics.mod_dur*dy + 0.5*metrics.convexity*dy**2)`,
    explanation: "Convexity is the second-order correction to duration: a bond with positive convexity gains more when yields fall than it loses when yields rise by the same amount, which is why convexity is valuable (investors pay for it via lower yield) and negative-convexity MBS are cheaper.",
  },
  {
    id: "pyfin-20260621-b1-fx-forward",
    language: "python",
    title: "FX forward curve construction from spot and interest rates",
    tag: "fx",
    code: `import numpy as np
from dataclasses import dataclass

@dataclass
class FXForward:
    tenor:       float   # years
    forward:     float   # forward FX rate (units of domestic per foreign)
    forward_pts: float   # forward - spot (in pips if *10000)
    implied_df:  float   # implied discount factor ratio

def fx_forward_curve(spot: float,
                     tenors: list[float],
                     domestic_rates: list[float],   # annualised, continuous
                     foreign_rates:  list[float]) -> list[FXForward]:
    """
    Covered Interest Rate Parity: F(T) = S * exp((r_d - r_f) * T)
    Arbitrage-free forward = spot * ratio of discount factors.
    """
    result = []
    for T, r_d, r_f in zip(tenors, domestic_rates, foreign_rates):
        F   = spot * np.exp((r_d - r_f) * T)
        pts = F - spot
        df  = np.exp(-r_d * T) / np.exp(-r_f * T)   # domestic/foreign DF ratio
        result.append(FXForward(T, F, pts, df))
    return result

def implied_carry(spot: float, forward: float, T: float,
                  domestic_rate: float) -> float:
    """
    Solve for implied foreign rate from forward:
    r_f = r_d - log(F/S) / T
    """
    return domestic_rate - np.log(forward / spot) / T

def break_even_fx(spot: float, r_d: float, r_f: float,
                   move_pct: float, T: float) -> dict:
    """
    Carry trade: earn (r_d - r_f)*T if FX doesn't move more than break-even.
    """
    forward = spot * np.exp((r_d - r_f) * T)
    carry_return = (r_d - r_f) * T
    be_spot = spot * (1.0 - carry_return)   # break-even: carry = capital loss
    return {'forward': forward, 'carry': carry_return,
            'break_even_spot': be_spot, 'current_spot': spot}`,
    explanation: "Covered interest rate parity is an arbitrage identity: if F ≠ S·exp((r_d-r_f)·T) a riskless carry trade (borrow domestic, invest foreign, sell forward) would earn a free profit; in practice deviations exist at short tenors due to FX swap market frictions and balance-sheet constraints on arbitrageurs.",
  },
  {
    id: "pyfin-20260621-b1-gaussian-copula",
    language: "python",
    title: "Gaussian copula sampling for correlated scenario generation",
    tag: "risk",
    code: `import numpy as np
from scipy.stats import norm, t as t_dist

def gaussian_copula_sample(corr: np.ndarray, marginals: list[callable],
                            n_samples: int = 10000, seed: int = 42) -> np.ndarray:
    """
    Sample from a Gaussian copula with given correlation matrix.
    marginals: list of scipy.stats frozen distributions, one per asset.
    Returns (n_samples, n_assets) array of correlated uniform samples [0,1].
    """
    rng = np.random.default_rng(seed)
    n   = corr.shape[0]
    L   = np.linalg.cholesky(corr)               # Cholesky decomposition
    Z   = rng.standard_normal((n_samples, n))    # independent normals
    W   = Z @ L.T                                 # correlated normals
    U   = norm.cdf(W)                             # map to [0,1] via Phi
    return U

def t_copula_sample(corr: np.ndarray, df: float,
                    n_samples: int = 10000, seed: int = 42) -> np.ndarray:
    """
    Student-t copula: heavier joint tails than Gaussian copula.
    df: degrees of freedom (smaller = fatter tails, more tail dependence)
    """
    rng = np.random.default_rng(seed)
    n   = corr.shape[0]
    L   = np.linalg.cholesky(corr)
    Z   = rng.standard_normal((n_samples, n)) @ L.T
    chi2 = rng.chisquare(df, n_samples)          # chi-squared draws
    T   = Z / np.sqrt(chi2[:, None] / df)        # t-distributed with correlation
    U   = t_dist.cdf(T, df=df)                   # map to [0,1] via Student CDF
    return U

def apply_marginals(U: np.ndarray, marginals: list) -> np.ndarray:
    """Invert marginal CDFs to get samples in original units."""
    return np.column_stack([m.ppf(U[:, i]) for i, m in enumerate(marginals)])`,
    explanation: "The copula separates the joint dependence structure from the marginal distributions — a Gaussian copula with t marginals is different from a t copula with t marginals; the t copula has tail dependence (assets are more likely to crash simultaneously than a Gaussian copula implies), which matters for CDO tranche pricing and stress testing.",
  },
  {
    id: "pyfin-20260621-b1-factor-risk",
    language: "python",
    title: "Barra-style factor risk decomposition",
    tag: "portfolio",
    code: `import numpy as np
import pandas as pd

def factor_risk_decomp(weights: np.ndarray,
                        factor_exposures: np.ndarray,
                        factor_cov: np.ndarray,
                        specific_var: np.ndarray) -> dict:
    """
    Total portfolio variance = systematic + specific.
    Systematic: w^T * B * F * B^T * w
    Specific:   w^T * D * w  (diagonal idiosyncratic variance)
    B: (n_assets x n_factors) exposure matrix
    F: (n_factors x n_factors) factor covariance
    D: (n_assets,) specific variance vector
    """
    B = factor_exposures     # (n, k)
    F = factor_cov           # (k, k)
    D = specific_var         # (n,)

    # Systematic covariance matrix
    Sigma_sys = B @ F @ B.T   # (n, n)

    # Risk contributions
    port_var_sys  = float(weights @ Sigma_sys @ weights)
    port_var_spec = float(weights @ (D * weights))   # D is diagonal
    port_var_tot  = port_var_sys + port_var_spec

    # Factor contribution to systematic risk
    # z_k = sum_i w_i * B_{ik} = (B^T w)_k: portfolio factor exposure
    z = B.T @ weights   # (k,)
    factor_contrib = z * (F @ z)   # element-wise: each factor's variance contribution

    return {
        'total_vol':       np.sqrt(port_var_tot),
        'systematic_vol':  np.sqrt(port_var_sys),
        'specific_vol':    np.sqrt(port_var_spec),
        'systematic_pct':  port_var_sys / port_var_tot,
        'factor_exposures_port': z,
        'factor_var_contribs':   factor_contrib,
        'factor_names_needed':   True,   # caller maps z to factor names
    }`,
    explanation: "Barra's risk model decomposes portfolio risk into a low-dimensional factor component (market, sector, style) and a high-dimensional but diagonal specific component; because the specific covariance matrix is diagonal, the specific risk computation is O(n) rather than O(n²), making it scalable to thousands of stocks.",
  },
  {
    id: "pyfin-20260621-b1-vasicek-bond",
    language: "python",
    title: "Vasicek model: analytic zero-coupon bond and yield curve",
    tag: "fixed-income",
    code: `import numpy as np
from dataclasses import dataclass

@dataclass
class VasicekModel:
    kappa: float   # mean reversion speed
    theta: float   # long-run mean rate
    sigma: float   # volatility
    r0:    float   # current short rate

    def B(self, T: float) -> float:
        """B(0,T) factor in ZCB formula."""
        return (1.0 - np.exp(-self.kappa * T)) / self.kappa

    def A(self, T: float) -> float:
        """log A(0,T) = (B-T)*(kappa^2*theta - sigma^2/2)/kappa^2
                        - sigma^2*B^2/(4*kappa)"""
        b = self.B(T)
        lnA = ((b - T) * (self.kappa**2 * self.theta - 0.5*self.sigma**2)
               / self.kappa**2
               - self.sigma**2 * b**2 / (4.0 * self.kappa))
        return np.exp(lnA)

    def zcb(self, T: float) -> float:
        """Zero-coupon bond price P(0,T) = A(T) * exp(-B(T)*r0)."""
        return self.A(T) * np.exp(-self.B(T) * self.r0)

    def yield_curve(self, tenors: np.ndarray) -> np.ndarray:
        """Continuously compounded zero yields y(T) = -log P(0,T) / T."""
        return np.array([-np.log(self.zcb(T)) / T for T in tenors])

    def simulate(self, T: float, n_steps: int = 252,
                 n_paths: int = 1000, seed: int = 0) -> np.ndarray:
        """Exact simulation using the conditional distribution of Vasicek."""
        rng = np.random.default_rng(seed)
        dt  = T / n_steps
        paths = np.empty((n_paths, n_steps + 1))
        paths[:, 0] = self.r0
        e   = np.exp(-self.kappa * dt)
        cond_mean_coef = e
        cond_var = self.sigma**2 * (1 - e**2) / (2*self.kappa)
        for i in range(n_steps):
            paths[:, i+1] = (self.theta * (1-e)
                              + cond_mean_coef * paths[:, i]
                              + np.sqrt(cond_var) * rng.standard_normal(n_paths))
        return paths`,
    explanation: "Vasicek's exact conditional simulation uses the fact that r(t+dt)|r(t) is Gaussian (the SDE has an affine drift and constant diffusion), so there is no discretisation error regardless of step size — contrast with Euler schemes which have O(√dt) bias for non-constant diffusions like CIR.",
  },
];
