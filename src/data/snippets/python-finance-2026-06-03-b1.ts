import type { Snippet } from "./types";

export const pythonFinanceSnippets20260603B1: Snippet[] = [
  {
    id: "pyfin-20260603-b1-garch",
    language: "python",
    title: "GARCH(1,1) fitting with arch — conditional volatility forecasting",
    tag: "finance",
    code: `import numpy as np
# pip install arch
from arch import arch_model

np.random.seed(42)
# Simulate GARCH(1,1) daily returns: alpha=0.1, beta=0.85, omega=0.0001
n = 2000
h = np.zeros(n + 1); h[0] = 0.0001
e = np.random.standard_normal(n)
r = np.zeros(n)
for t in range(n):
    h[t+1] = 0.0001 + 0.10 * (r[t-1]**2 if t > 0 else 0) + 0.85 * h[t]
    r[t]   = np.sqrt(h[t]) * e[t]

# Scale to percentage returns for numerical stability.
am = arch_model(r * 100, vol='Garch', p=1, q=1, dist='normal')
res = am.fit(disp='off')
print(res.params.round(4))

# 5-step-ahead variance forecast.
fc = res.forecast(horizon=5)
vol_forecast = np.sqrt(fc.variance.iloc[-1].values / 10000)  # back to level
print(f"5-day vol forecasts: {np.round(vol_forecast, 5)}")

# Persistence = alpha + beta; if close to 1, shocks die slowly.
a, b = res.params['alpha[1]'], res.params['beta[1]']
print(f"persistence: {a + b:.4f}")`,
    explanation:
      "GARCH(1,1) persistence (alpha+beta) near 1 implies volatility clustering: today's high vol predicts tomorrow's high vol. The arch library uses quasi-maximum likelihood, robust to non-normality, and the Student-t distribution flag captures fat tails common in daily equity returns.",
  },
  {
    id: "pyfin-20260603-b1-heston-mc",
    language: "python",
    title: "Heston model Monte Carlo — correlated vol-of-vol paths",
    tag: "finance",
    code: `import numpy as np

def heston_call_mc(S: float, K: float, r: float, v0: float,
                   kappa: float, theta: float, sigma_v: float,
                   rho: float, T: float,
                   n_steps: int = 252, n_paths: int = 100_000,
                   seed: int = 42) -> float:
    """
    Euler-Maruyama simulation with full-truncation variance scheme.
    rho < 0 produces the equity skew (spot-vol negative correlation).
    """
    rng = np.random.default_rng(seed)
    dt  = T / n_steps
    disc = np.exp(-r * T)

    S_t = np.full(n_paths, S, dtype=float)
    v_t = np.full(n_paths, v0, dtype=float)

    for _ in range(n_steps):
        Z1 = rng.standard_normal(n_paths)
        Z2 = rho * Z1 + np.sqrt(1 - rho**2) * rng.standard_normal(n_paths)
        v_pos = np.maximum(v_t, 0.0)   # full-truncation: prevent negative variance
        S_t  *= np.exp((r - 0.5 * v_pos) * dt + np.sqrt(v_pos * dt) * Z1)
        v_t  += kappa * (theta - v_pos) * dt + sigma_v * np.sqrt(v_pos * dt) * Z2

    return disc * np.maximum(S_t - K, 0.0).mean()

# Typical calibrated params for S&P 500 index options.
price = heston_call_mc(S=100, K=100, r=0.05, v0=0.04,
                       kappa=2.0, theta=0.04, sigma_v=0.3, rho=-0.7, T=1.0)
print(f"Heston MC call: {price:.4f}")`,
    explanation:
      "The Heston model replicates the implied vol smile via stochastic variance — unlike Black-Scholes which has flat vol. The full-truncation scheme (max(v,0)) keeps the variance non-negative under coarse Euler steps; rho<0 creates the negative skew observed in equity index options where falling prices correlate with rising vol.",
  },
  {
    id: "pyfin-20260603-b1-sabr",
    language: "python",
    title: "SABR model — smile-consistent implied vol and calibration",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize
from scipy.stats import norm

def sabr_vol(F: float, K: float, T: float,
             alpha: float, beta: float, rho: float, nu: float) -> float:
    """Hagan et al. (2002) SABR approximate implied vol (lognormal)."""
    if abs(F - K) < 1e-8:   # ATM formula
        FK_mid = F ** (1 - beta)
        atm_vol = alpha / FK_mid
        term = ((1 - beta)**2 / 24 * alpha**2 / FK_mid**2
                + rho * beta * nu * alpha / (4 * FK_mid)
                + (2 - 3*rho**2) / 24 * nu**2)
        return atm_vol * (1 + term * T)

    FK      = F * K
    FKmid   = FK ** ((1 - beta) / 2)
    logFK   = np.log(F / K)
    z       = nu / alpha * FKmid * logFK
    x       = np.log((np.sqrt(1 - 2*rho*z + z**2) + z - rho) / (1 - rho))
    A = alpha / (FKmid * (1 + (1-beta)**2/24 * logFK**2 + (1-beta)**4/1920 * logFK**4))
    B = z / x if abs(x) > 1e-8 else 1.0
    C = 1 + ((1-beta)**2/24 * alpha**2/FKmid**2
              + rho*beta*nu*alpha / (4*FKmid)
              + (2 - 3*rho**2)/24 * nu**2) * T
    return A * B * C

# Calibrate alpha, rho, nu to market smile (beta fixed by convention).
F, T, beta = 100.0, 1.0, 0.5
strikes = np.array([85, 90, 95, 100, 105, 110, 115])
mkt_vols = np.array([0.235, 0.215, 0.200, 0.190, 0.187, 0.188, 0.193])

def error(params):
    a, rho, nu = params
    if not (-1 < rho < 1 and a > 0 and nu > 0):
        return 1e10
    fitted = np.array([sabr_vol(F, K, T, a, beta, rho, nu) for K in strikes])
    return np.sum((fitted - mkt_vols)**2)

res = minimize(error, [0.25, -0.3, 0.5], method='Nelder-Mead')
alpha_fit, rho_fit, nu_fit = res.x
print(f"alpha={alpha_fit:.4f}, rho={rho_fit:.4f}, nu={nu_fit:.4f}")`,
    explanation:
      "SABR (Stochastic Alpha Beta Rho) is the standard smile model for rates and FX because it has an analytical vol approximation, making calibration fast. Beta=0.5 (CIR-like) is conventional for interest rates; beta=1 (lognormal) for FX. The rho parameter controls skew direction; nu controls smile curvature.",
  },
  {
    id: "pyfin-20260603-b1-dupire-localvol",
    language: "python",
    title: "Dupire local vol — extracted from implied vol surface numerically",
    tag: "finance",
    code: `import numpy as np
from scipy.interpolate import RectBivariateSpline
from scipy.stats import norm

def bs_call_price(S: float, K: float, r: float, sigma: float, T: float) -> float:
    if T < 1e-8 or sigma < 1e-8:
        return max(S - K * np.exp(-r * T), 0.0)
    sT = sigma * np.sqrt(T)
    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / sT
    d2 = d1 - sT
    return S * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)

def dupire_local_vol(S0: float, r: float,
                     strikes: np.ndarray, expiries: np.ndarray,
                     iv_surface: np.ndarray) -> np.ndarray:
    """
    Dupire (1994): sigma_loc^2(K,T) = (dC/dT + r*K*dC/dK) / (0.5*K^2*d2C/dK2)
    iv_surface shape: (len(expiries), len(strikes))
    Returns local vol surface (same shape, interior only).
    """
    # Convert implied vols to call prices.
    C = np.array([[bs_call_price(S0, K, r, iv_surface[i, j], T)
                   for j, K in enumerate(strikes)]
                  for i, T in enumerate(expiries)])

    spline = RectBivariateSpline(expiries, strikes, C, kx=3, ky=3)
    n_T, n_K = len(expiries), len(strikes)
    lv = np.full((n_T, n_K), np.nan)

    for i, T in enumerate(expiries):
        for j, K in enumerate(strikes):
            dCdT   = spline(T, K, dx=1, dy=0)[0, 0]
            dCdK   = spline(T, K, dx=0, dy=1)[0, 0]
            d2CdK2 = spline(T, K, dx=0, dy=2)[0, 0]
            num    = dCdT + r * K * dCdK
            den    = 0.5 * K**2 * d2CdK2
            if den > 1e-10 and num > 0:
                lv[i, j] = np.sqrt(num / den)
    return lv

# Tiny example surface.
strikes  = np.array([90.0, 95.0, 100.0, 105.0, 110.0])
expiries = np.array([0.25, 0.5, 1.0, 2.0])
ivs = np.array([[0.22, 0.20, 0.18, 0.17, 0.18],
                [0.21, 0.19, 0.175, 0.168, 0.175],
                [0.20, 0.185, 0.17, 0.165, 0.172],
                [0.19, 0.178, 0.165, 0.160, 0.168]])
lv = dupire_local_vol(100.0, 0.05, strikes, expiries, ivs)
print("local vol surface (approx):")
print(np.round(lv, 4))`,
    explanation:
      "Dupire's formula derives the unique local vol surface consistent with all observed call prices — it's the link between the risk-neutral density (second derivative of calls w.r.t. strike) and the forward variance. Numerical stability requires a smooth, arbitrage-free implied vol surface as input; calendar or butterfly arb will produce negative local variances.",
  },
  {
    id: "pyfin-20260603-b1-cds-hazard",
    language: "python",
    title: "CDS hazard rate bootstrapping — piecewise-constant intensity",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import brentq

def cds_premium_leg(tenors, hazard_rates, discount_factors, spread, recovery=0.4):
    """PV of premium leg: spread * sum(survival_prob * df * dcf)."""
    surv = np.ones(len(tenors) + 1)
    for i, h in enumerate(hazard_rates):
        dt = tenors[i] - (tenors[i-1] if i > 0 else 0.0)
        surv[i+1] = surv[i] * np.exp(-h * dt)
    pv = 0.0
    for i in range(len(tenors)):
        dcf  = tenors[i] - (tenors[i-1] if i > 0 else 0.0)
        pv  += spread * surv[i+1] * discount_factors[i] * dcf
    return pv

def cds_protection_leg(tenors, hazard_rates, discount_factors, recovery=0.4):
    """PV of protection leg: LGD * sum(default_prob * df_mid)."""
    lgd  = 1 - recovery
    surv = [1.0]
    for i, h in enumerate(hazard_rates):
        dt = tenors[i] - (tenors[i-1] if i > 0 else 0.0)
        surv.append(surv[-1] * np.exp(-h * dt))
    pv = 0.0
    for i in range(len(tenors)):
        df_mid = discount_factors[i]   # simplified: mid-period approx
        dp     = surv[i] - surv[i+1]  # marginal default probability
        pv    += lgd * df_mid * dp
    return pv

def bootstrap_hazard_rates(tenors, par_spreads, discount_factors, recovery=0.4):
    """Bootstrap piecewise-constant hazard rates from CDS par spreads."""
    hazards = []
    for i, (T, s) in enumerate(zip(tenors, par_spreads)):
        prev_hazards = hazards.copy()
        sub_tenors = tenors[:i+1]
        sub_dfs    = discount_factors[:i+1]
        def objective(h):
            hs = prev_hazards + [h]
            prem = cds_premium_leg(sub_tenors, hs, sub_dfs, s, recovery)
            prot = cds_protection_leg(sub_tenors, hs, sub_dfs, recovery)
            return prem - prot
        h_star = brentq(objective, 1e-6, 5.0)
        hazards.append(h_star)
    return hazards

tenors   = [0.5, 1.0, 2.0, 3.0, 5.0]
spreads  = [0.008, 0.010, 0.015, 0.018, 0.022]   # par CDS spreads
dfs      = [np.exp(-0.05*t) for t in tenors]
hazards  = bootstrap_hazard_rates(tenors, spreads, dfs)
print("hazard rates:", [round(h, 5) for h in hazards])`,
    explanation:
      "CDS bootstrapping is the credit analogue of yield curve bootstrapping: each tenor's hazard rate is solved by making the par CDS flat (premium leg = protection leg). Piecewise-constant hazard rates produce a piecewise-exponential survival function — common in ISDA Standard CDS model implementations.",
  },
  {
    id: "pyfin-20260603-b1-fama-french",
    language: "python",
    title: "Fama-French 3-factor model regression — alpha and factor exposures",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
import statsmodels.api as sm

np.random.seed(7)
n = 252   # one year of daily data

# Simulate factor returns (Mkt-RF, SMB, HML) and risk-free rate.
mkt  = np.random.normal(0.0004, 0.01, n)   # market excess return
smb  = np.random.normal(0.0001, 0.005, n)  # small minus big
hml  = np.random.normal(0.0001, 0.005, n)  # high minus low (value)
rf   = 0.05 / 252 * np.ones(n)             # daily risk-free rate

# Stock return with known loadings + alpha.
true_alpha, b_mkt, b_smb, b_hml = 0.0002, 1.2, 0.4, -0.2
ret  = (rf + true_alpha
        + b_mkt * mkt + b_smb * smb + b_hml * hml
        + np.random.normal(0, 0.003, n))   # idiosyncratic
ret_excess = ret - rf

factors = pd.DataFrame({'MktRF': mkt, 'SMB': smb, 'HML': hml})
X = sm.add_constant(factors)
model = sm.OLS(ret_excess, X).fit(cov_type='HC3')   # heteroscedasticity-robust SE
print(model.summary().tables[1])   # coefficients table

# Annualised alpha.
alpha_daily = model.params['const']
print(f"annualised alpha: {alpha_daily * 252:.4f}")
print(f"t-stat (alpha):   {model.tvalues['const']:.2f}")`,
    explanation:
      "The Fama-French 3-factor model decomposes a stock's return into market beta, size (SMB), and value (HML) exposures. The intercept (alpha) is pure manager or strategy skill after factor attribution. HC3 heteroscedasticity-consistent standard errors are essential for daily returns, which exhibit time-varying variance.",
  },
  {
    id: "pyfin-20260603-b1-rf-alpha",
    language: "python",
    title: "Random forest alpha signal — feature importance and cross-validation",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import accuracy_score

np.random.seed(42)
n = 1000

# Features: technical indicators as potential alpha signals.
features = pd.DataFrame({
    'mom_5d':   np.random.randn(n),     # 5-day momentum
    'mom_20d':  np.random.randn(n),     # 20-day momentum
    'rsi_14':   np.random.uniform(0, 1, n),
    'vol_ratio': np.random.lognormal(0, 0.1, n),   # short/long vol ratio
    'skew_5d':  np.random.randn(n),
})

# Target: next-day return direction (1 = up, 0 = down).
# Inject a weak 1-day momentum signal.
ret_next = np.sign(features['mom_5d'] * 0.15 + np.random.randn(n) * 0.9)
target   = (ret_next > 0).astype(int)

# Walk-forward cross-validation — never train on the future.
tscv = TimeSeriesSplit(n_splits=5)
rf   = RandomForestClassifier(n_estimators=200, max_depth=5,
                               min_samples_leaf=20, random_state=42)
accs = []
for tr_idx, te_idx in tscv.split(features):
    rf.fit(features.iloc[tr_idx], target.iloc[tr_idx])
    preds = rf.predict(features.iloc[te_idx])
    accs.append(accuracy_score(target.iloc[te_idx], preds))

print(f"CV accuracy: {np.mean(accs):.3f} ± {np.std(accs):.3f}")

# Feature importance (Gini impurity reduction).
imp = pd.Series(rf.feature_importances_, index=features.columns)
print(imp.sort_values(ascending=False))`,
    explanation:
      "TimeSeriesSplit enforces temporal ordering — shuffled k-fold on financial data leaks future information and inflates out-of-sample metrics. Feature importance from Gini impurity is a quick first screen, but be aware it biases toward high-cardinality features; prefer permutation importance for production.",
  },
  {
    id: "pyfin-20260603-b1-kalman-pairs",
    language: "python",
    title: "Kalman filter pairs trading — dynamic hedge ratio estimation",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def kalman_filter_pairs(y: np.ndarray, x: np.ndarray,
                         delta: float = 1e-4,
                         R_obs: float = 1e-2) -> tuple:
    """
    Kalman filter for time-varying hedge ratio beta_t in:
      y_t = alpha_t + beta_t * x_t + epsilon_t
    State vector: [alpha, beta]. Observation: y.
    delta controls how fast beta is allowed to vary.
    """
    n  = len(y)
    # State transition: random walk on [alpha, beta].
    F  = np.eye(2)
    Q  = delta / (1 - delta) * np.eye(2)   # state noise covariance
    R  = R_obs                              # observation noise variance
    H  = np.ones((1, 2))                   # observation matrix (changes each step)

    theta = np.zeros(2)           # [alpha, beta] state estimate
    P     = np.zeros((2, 2))      # state covariance

    betas  = np.zeros(n)
    alphas = np.zeros(n)
    spreads = np.zeros(n)

    for t in range(n):
        H[0, 1] = x[t]           # update observation matrix with current x

        # Predict.
        theta_pred = F @ theta
        P_pred     = F @ P @ F.T + Q

        # Update.
        S      = H @ P_pred @ H.T + R    # innovation variance
        K_gain = P_pred @ H.T / S[0, 0]  # Kalman gain
        innov  = y[t] - H @ theta_pred
        theta  = theta_pred + K_gain.flatten() * innov
        P      = (np.eye(2) - K_gain @ H) @ P_pred

        alphas[t]  = theta[0]
        betas[t]   = theta[1]
        spreads[t] = y[t] - betas[t] * x[t] - alphas[t]

    return alphas, betas, spreads

np.random.seed(0)
n = 500
x  = np.cumsum(np.random.normal(0, 1, n))
# Cointegrated y with slowly drifting beta.
beta_true = 0.8 + np.cumsum(np.random.normal(0, 0.001, n))
y  = beta_true * x + np.random.normal(0, 0.5, n)

alphas, betas, spread = kalman_filter_pairs(y, x)
print(f"final beta estimate: {betas[-1]:.4f} (true: {beta_true[-1]:.4f})")
print(f"spread std: {spread.std():.4f}")`,
    explanation:
      "The Kalman filter adapts the hedge ratio in real time as the cointegrating relationship drifts — unlike a fixed OLS regression which becomes stale. The delta parameter controls the half-life of the beta: smaller delta means more inertia (slower adaptation). Trading signal: enter when |spread| > 2*std, exit at mean reversion.",
  },
  {
    id: "pyfin-20260603-b1-clayton-copula",
    language: "python",
    title: "Clayton copula — lower-tail dependence for credit portfolio",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import uniform, norm

def clayton_copula_sample(theta: float, n: int, seed: int = 42) -> np.ndarray:
    """
    Simulate n samples from a bivariate Clayton copula with parameter theta.
    Clayton exhibits lower-tail dependence: lambda_L = 2^(-1/theta) > 0.
    Uses the conditional distribution method.
    """
    rng = np.random.default_rng(seed)
    u1  = rng.uniform(0, 1, n)
    p   = rng.uniform(0, 1, n)

    # Inverse of the conditional distribution C(u2 | u1).
    # C(u1,u2) = (u1^{-theta} + u2^{-theta} - 1)^{-1/theta}
    # u2 | u1 ~ conditional derived from partial derivative.
    exponent = -theta / (1 + theta)
    u2 = u1 * (p ** exponent - 1 + u1**theta) ** (-1/theta)
    u2 = np.clip(u2, 1e-8, 1 - 1e-8)
    return np.column_stack([u1, u2])

# Lower-tail dependence coefficient: lambda_L = 2^(-1/theta)
theta = 2.0
lam_L = 2 ** (-1 / theta)
print(f"theta={theta}, lower-tail dependence: {lam_L:.4f}")

samples = clayton_copula_sample(theta, n=10_000)

# Convert uniform marginals to standard normals for correlation analysis.
z = norm.ppf(samples)
empirical_corr = np.corrcoef(z[:, 0], z[:, 1])[0, 1]
print(f"Pearson corr in normal space: {empirical_corr:.4f}")

# Measure lower-tail dependence empirically: P(U1<0.05 | U2<0.05).
mask = (samples[:, 1] < 0.05)
lam_L_emp = np.mean(samples[mask, 0] < 0.05) if mask.sum() > 0 else 0
print(f"empirical lower-tail lambda: {lam_L_emp:.4f} (theoretical: {lam_L:.4f})")`,
    explanation:
      "The Clayton copula models lower-tail dependence — assets crash together more than they rally together — which is empirically observed in credit portfolios and equity crashes. The upper-tail dependence is zero for Clayton, in contrast to the Gumbel copula which models upper-tail dependence. Gaussian copulas (used in CDO pricing pre-2008) have zero tail dependence by construction.",
  },
  {
    id: "pyfin-20260603-b1-antithetic",
    language: "python",
    title: "Antithetic variates — halving MC variance with paired paths",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm as scipy_norm

def bs_call(S, K, r, sigma, T):
    sT = sigma * np.sqrt(T)
    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / sT
    d2 = d1 - sT
    return S * scipy_norm.cdf(d1) - K * np.exp(-r * T) * scipy_norm.cdf(d2)

def mc_call_plain(S, K, r, sigma, T, n, seed=42):
    rng = np.random.default_rng(seed)
    Z   = rng.standard_normal(n)
    ST  = S * np.exp((r - 0.5 * sigma**2) * T + sigma * np.sqrt(T) * Z)
    payoffs = np.maximum(ST - K, 0)
    price = np.exp(-r * T) * payoffs.mean()
    std   = payoffs.std() / np.sqrt(n)
    return price, std

def mc_call_antithetic(S, K, r, sigma, T, n, seed=42):
    """Antithetic variates: use Z and -Z, average their payoffs."""
    rng = np.random.default_rng(seed)
    n_half = n // 2
    Z   = rng.standard_normal(n_half)
    def terminal(z):
        return S * np.exp((r - 0.5 * sigma**2) * T + sigma * np.sqrt(T) * z)
    ST_pos = terminal(Z)
    ST_neg = terminal(-Z)   # antithetic path
    payoffs = 0.5 * (np.maximum(ST_pos - K, 0) + np.maximum(ST_neg - K, 0))
    price = np.exp(-r * T) * payoffs.mean()
    std   = payoffs.std() / np.sqrt(n_half)
    return price, std

S, K, r, sigma, T, n = 100, 100, 0.05, 0.20, 1.0, 50_000
exact   = bs_call(S, K, r, sigma, T)
p_plain, se_plain = mc_call_plain(S, K, r, sigma, T, n)
p_anti,  se_anti  = mc_call_antithetic(S, K, r, sigma, T, n)

print(f"exact: {exact:.4f}")
print(f"plain MC:      {p_plain:.4f}, SE={se_plain:.5f}")
print(f"antithetic MC: {p_anti:.4f},  SE={se_anti:.5f}")
print(f"variance reduction: {(se_plain/se_anti)**2:.1f}x")`,
    explanation:
      "Antithetic variates exploits the symmetry of the normal distribution: for every path with shocks Z, generate the mirror path with -Z. The two paths are negatively correlated, so averaging their payoffs reduces variance by a factor of (1-rho)/2 where rho is the correlation between paired payoffs. For ATM calls, variance reductions of 4–10x are typical.",
  },
  {
    id: "pyfin-20260603-b1-importance-sampling",
    language: "python",
    title: "Importance sampling — deep OTM option pricing with shifted measure",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def bs_call(S, K, r, sigma, T):
    sT = sigma * np.sqrt(T)
    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / sT
    return S * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d1 - sT)

def mc_call_importance(S, K, r, sigma, T, n=100_000, seed=42):
    """
    Importance sampling for deep OTM calls.
    Shift the normal measure so that most paths end near the strike.
    mu_star = shift that centres the log-return distribution on ln(K/S).
    """
    rng = np.random.default_rng(seed)
    sT  = sigma * np.sqrt(T)

    # Optimal shift: centre distribution at ln(K/S) — paths are no longer rare.
    mu_star = (np.log(K / S) - (r - 0.5 * sigma**2) * T) / sT
    Z = rng.standard_normal(n) + mu_star           # shifted sample
    ST = S * np.exp((r - 0.5 * sigma**2) * T + sigma * np.sqrt(T) * Z)

    # Likelihood ratio (Radon-Nikodym derivative): reweight back to original measure.
    lr = np.exp(-mu_star * Z + 0.5 * mu_star**2)
    payoffs = np.maximum(ST - K, 0) * lr

    price = np.exp(-r * T) * payoffs.mean()
    std   = payoffs.std() / np.sqrt(n)
    return price, std

S, K, r, sigma, T = 100, 140, 0.05, 0.20, 1.0   # deep OTM: 40% out
exact = bs_call(S, K, r, sigma, T)
p_is, se_is = mc_call_importance(S, K, r, sigma, T, n=10_000)
print(f"exact: {exact:.6f}")
print(f"IS MC (10k):  {p_is:.6f}, SE={se_is:.7f}")
# Plain MC with 10k paths would need ~1M paths for comparable accuracy.`,
    explanation:
      "Importance sampling avoids the curse of rarity: for deep OTM options, fewer than 1 in 10 000 plain MC paths contribute to the payoff. By shifting the sampling distribution toward the exercise region and reweighting with the likelihood ratio, we concentrate computation where it matters and cut required paths by 100–1000x.",
  },
  {
    id: "pyfin-20260603-b1-parametric-var",
    language: "python",
    title: "Parametric VaR — normal and Student-t with fat-tail correction",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm, t as student_t

def parametric_var(returns: np.ndarray, confidence: float = 0.99,
                   holding_days: int = 1) -> dict:
    """
    Parametric VaR under normal and Student-t assumptions.
    Scales to multi-day holding period via sqrt-of-time rule.
    """
    mu    = returns.mean()
    sigma = returns.std(ddof=1)

    # Fit Student-t degrees of freedom via MLE (method of moments).
    # For kurtosis k: df = (4*k - 6) / (k - 3) when k > 3.
    kurtosis = float(np.mean(((returns - mu) / sigma) ** 4))
    if kurtosis > 3.0:
        df_hat = max(4.0, 6.0 / (kurtosis - 3.0) + 4.0)
    else:
        df_hat = 30.0   # approximately normal

    z_normal  = norm.ppf(1 - confidence)
    z_student = student_t.ppf(1 - confidence, df=df_hat)

    # Multi-day scaling: VaR(h) = VaR(1) * sqrt(h)  [approx for iid returns].
    scale = np.sqrt(holding_days)
    var_normal  = -(mu * holding_days + z_normal  * sigma * scale)
    var_student = -(mu * holding_days + z_student * sigma * scale
                    * np.sqrt((df_hat - 2) / df_hat))   # t-distribution variance correction

    return {
        "mu_daily": round(mu, 6),
        "sigma_daily": round(sigma, 6),
        "kurtosis": round(kurtosis, 4),
        "t_df": round(df_hat, 2),
        f"VaR_normal_{int(confidence*100)}pct_{holding_days}d": round(var_normal, 5),
        f"VaR_student_{int(confidence*100)}pct_{holding_days}d": round(var_student, 5),
    }

np.random.seed(1)
daily_ret = np.random.standard_t(df=5, size=1000) * 0.01   # fat-tailed
print(parametric_var(daily_ret, confidence=0.99, holding_days=10))`,
    explanation:
      "Student-t VaR is more conservative than normal VaR for fat-tailed distributions — the t-quantile is larger in magnitude than the normal quantile, particularly at 99th and 99.9th percentiles. The sqrt-of-time rule for multi-day VaR assumes i.i.d. returns and no autocorrelation; for GARCH returns use a simulated conditional distribution instead.",
  },
  {
    id: "pyfin-20260603-b1-historical-var",
    language: "python",
    title: "Historical simulation VaR with bootstrap confidence interval",
    tag: "finance",
    code: `import numpy as np

def historical_var(returns: np.ndarray, confidence: float = 0.99,
                   holding_days: int = 1, n_bootstrap: int = 1000,
                   seed: int = 42) -> dict:
    """
    Non-parametric historical simulation VaR.
    Bootstrap CI quantifies estimation uncertainty in the quantile.
    """
    rng = np.random.default_rng(seed)
    # Multi-day: aggregate daily returns into holding_days windows.
    if holding_days > 1:
        n_windows = len(returns) - holding_days + 1
        agg = np.array([returns[i:i+holding_days].sum()
                        for i in range(n_windows)])
    else:
        agg = returns.copy()

    alpha = 1 - confidence
    var_point = -np.quantile(agg, alpha)

    # Bootstrap 95% CI for the VaR estimate.
    boot_vars = np.array([
        -np.quantile(rng.choice(agg, len(agg)), alpha)
        for _ in range(n_bootstrap)
    ])
    ci_lower, ci_upper = np.quantile(boot_vars, [0.025, 0.975])

    return {
        "VaR": round(var_point, 6),
        "CI_lower": round(ci_lower, 6),
        "CI_upper": round(ci_upper, 6),
        "n_obs": len(agg),
        "breach_count": int((agg < -var_point).sum()),
    }

np.random.seed(0)
ret = np.concatenate([np.random.normal(0, 0.01, 900),
                      np.random.normal(-0.02, 0.025, 100)])  # stress tail
result = historical_var(ret, confidence=0.99, holding_days=5)
print(result)`,
    explanation:
      "Historical simulation requires no distributional assumptions — it reads directly from observed P&L — but the VaR estimate is noisy when the sample size is small relative to the tail probability. The bootstrap CI quantifies this estimation uncertainty: a wide CI means the VaR number itself is unreliable and requires more data or a parametric supplement.",
  },
  {
    id: "pyfin-20260603-b1-hull-white",
    language: "python",
    title: "Hull-White one-factor short rate — analytical bond prices and MC",
    tag: "finance",
    code: `import numpy as np

class HullWhite:
    """
    dr_t = (theta(t) - a*r_t) dt + sigma dW_t
    With flat initial curve: theta(t) = a*r_inf + a*sigma^2/(2*a^2)*(1-e^{-at})
    Analytical zero-coupon bond price: P(0,T) = exp(A(T) - B(T)*r0)
    """
    def __init__(self, a: float, sigma: float, r0: float, r_inf: float = None):
        self.a = a
        self.sigma = sigma
        self.r0 = r0
        self.r_inf = r_inf if r_inf is not None else r0

    def B(self, T: float) -> float:
        return (1 - np.exp(-self.a * T)) / self.a

    def A(self, T: float) -> float:
        b = self.B(T)
        return (self.r_inf * (b - T)
                - self.sigma**2 / (4 * self.a) * b**2)

    def zero_coupon_bond(self, T: float) -> float:
        return np.exp(self.A(T) - self.B(T) * self.r0)

    def simulate(self, T: float, n_steps: int = 252,
                 n_paths: int = 10_000, seed: int = 42) -> np.ndarray:
        """Euler simulation of the short rate. Returns (n_paths, n_steps+1)."""
        rng = np.random.default_rng(seed)
        dt  = T / n_steps
        r   = np.full((n_paths, n_steps + 1), self.r0)
        for t in range(n_steps):
            # theta calibrated to match initial forward curve exactly.
            theta_t = self.a * self.r_inf
            dW = rng.standard_normal(n_paths) * np.sqrt(dt)
            r[:, t+1] = (r[:, t]
                         + (theta_t - self.a * r[:, t]) * dt
                         + self.sigma * dW)
        return r

hw = HullWhite(a=0.1, sigma=0.01, r0=0.03, r_inf=0.05)
print(f"P(0,5)  analytical: {hw.zero_coupon_bond(5.0):.6f}")
print(f"P(0,10) analytical: {hw.zero_coupon_bond(10.0):.6f}")

paths = hw.simulate(T=5.0, n_steps=252 * 5, n_paths=20_000)
# MC zero-coupon bond price: average of exp(-integral r dt).
mc_price = np.exp(-paths[:, :-1].mean(axis=1) * 5.0).mean()
print(f"P(0,5)  MC approx:  {mc_price:.6f}")`,
    explanation:
      "Hull-White is popular because it fits the initial yield curve exactly via the time-dependent theta(t) function, unlike the Vasicek model. B(T) plays the role of duration — it is bounded above by 1/a regardless of maturity. The model produces normally distributed rates, allowing negative rates, which is appropriate for current EUR/JPY rate environments.",
  },
  {
    id: "pyfin-20260603-b1-multiindex-factor",
    language: "python",
    title: "pandas MultiIndex — factor portfolio construction and attribution",
    tag: "finance",
    code: `import pandas as pd
import numpy as np

np.random.seed(3)
dates   = pd.date_range("2025-01-01", periods=12, freq="ME")
stocks  = ["AAPL", "MSFT", "GOOG", "AMZN", "TSLA"]
factors = ["Value", "Momentum", "Quality"]

# MultiIndex DataFrame: (date, stock) x factors.
idx = pd.MultiIndex.from_product([dates, stocks], names=["date", "stock"])
df  = pd.DataFrame(
    np.random.randn(len(idx), len(factors)),
    index=idx, columns=factors
)

# Add return column.
df["return"] = np.random.normal(0.005, 0.04, len(idx))

# Monthly cross-sectional z-score normalisation per factor.
def xs_zscore(group):
    for col in factors:
        group[col] = (group[col] - group[col].mean()) / group[col].std(ddof=1)
    return group

df = df.groupby(level="date").apply(xs_zscore)

# Long-short factor portfolio: equal-weight top/bottom quintile by Momentum.
def build_ls_portfolio(group):
    q = pd.qcut(group["Momentum"], 5, labels=False)
    w = pd.Series(0.0, index=group.index)
    w[q == 4] =  1.0 / (q == 4).sum()   # long top quintile
    w[q == 0] = -1.0 / (q == 0).sum()   # short bottom quintile
    return pd.Series({"pnl": (w * group["return"]).sum()})

monthly_pnl = df.groupby(level="date").apply(build_ls_portfolio)
sharpe = monthly_pnl["pnl"].mean() / monthly_pnl["pnl"].std() * np.sqrt(12)
print(monthly_pnl.round(4))
print(f"annualised Sharpe: {sharpe:.2f}")`,
    explanation:
      "MultiIndex DataFrames with (date, stock) indexing are the natural pandas structure for panel data. groupby(level='date').apply() runs cross-sectional operations per period, mimicking the panel OLS or portfolio sort analyses that underpin most equity factor research. The long-short construction is market-neutral by construction.",
  },
  {
    id: "pyfin-20260603-b1-binomial-american",
    language: "python",
    title: "CRR binomial tree — American put with early exercise detection",
    tag: "finance",
    code: `import numpy as np

def binomial_american_put(S: float, K: float, r: float,
                           sigma: float, T: float, N: int = 500) -> float:
    """
    Cox-Ross-Rubinstein binomial tree for American put.
    At each node: max(intrinsic, continuation) — the early exercise condition.
    """
    dt  = T / N
    u   = np.exp(sigma * np.sqrt(dt))      # up factor
    d   = 1.0 / u                          # down factor (CRR: u*d=1)
    disc = np.exp(-r * dt)
    p   = (np.exp(r * dt) - d) / (u - d)  # risk-neutral up probability

    # Terminal stock prices (vectorised over all 2^N terminal nodes).
    j  = np.arange(N + 1)
    ST = S * u**j * d**(N - j)
    V  = np.maximum(K - ST, 0.0)          # put payoff at maturity

    # Backward induction through the tree.
    for step in range(N - 1, -1, -1):
        j  = np.arange(step + 1)
        Sj = S * u**j * d**(step - j)      # stock prices at this step
        # Continuation value.
        V  = disc * (p * V[1:step+2] + (1 - p) * V[0:step+1])
        # American early exercise: compare to intrinsic value.
        V  = np.maximum(K - Sj, V)

    return float(V[0])

# American put is worth more than European (early exercise premium).
amer_put = binomial_american_put(100, 100, 0.05, 0.20, 1.0, N=500)
print(f"American put (N=500 steps): {amer_put:.4f}")
# European put for comparison (no early exercise).
from scipy.stats import norm
r, sigma, T, S, K = 0.05, 0.20, 1.0, 100, 100
d1 = (np.log(S/K) + (r+0.5*sigma**2)*T) / (sigma*np.sqrt(T))
d2 = d1 - sigma*np.sqrt(T)
euro_put = K*np.exp(-r*T)*norm.cdf(-d2) - S*norm.cdf(-d1)
print(f"European put (BS):          {euro_put:.4f}")`,
    explanation:
      "The CRR binomial tree converges to the Black-Scholes price for European options as N→∞ because the u and d factors are chosen to match the first two moments of the log-normal distribution. American options require backward induction: at each node compare the immediate exercise value to the discounted continuation value and take the max.",
  },
  {
    id: "pyfin-20260603-b1-nelson-siegel",
    language: "python",
    title: "Nelson-Siegel yield curve fitting — 3-factor parametric model",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def nelson_siegel(tau: np.ndarray, beta0: float, beta1: float,
                  beta2: float, lam: float) -> np.ndarray:
    """
    Nelson-Siegel (1987):
      y(tau) = beta0
             + beta1 * (1 - e^{-tau/lam}) / (tau/lam)
             + beta2 * [(1 - e^{-tau/lam}) / (tau/lam) - e^{-tau/lam}]
    beta0 = long-run level, beta1 = slope, beta2 = hump, lam = decay.
    """
    t = tau / lam
    factor1 = (1 - np.exp(-t)) / t
    factor2 = factor1 - np.exp(-t)
    return beta0 + beta1 * factor1 + beta2 * factor2

def fit_ns(maturities: np.ndarray, yields: np.ndarray) -> dict:
    def objective(p):
        b0, b1, b2, lam = p
        if lam <= 0:
            return 1e10
        fitted = nelson_siegel(maturities, b0, b1, b2, lam)
        return np.sum((fitted - yields) ** 2)

    # Initial guess: flat at long-run yield.
    x0 = [yields.mean(), yields[0] - yields[-1], 0.0, 2.0]
    res = minimize(objective, x0, method='Nelder-Mead',
                   options={'xatol': 1e-9, 'fatol': 1e-12, 'maxiter': 10_000})
    b0, b1, b2, lam = res.x
    fitted = nelson_siegel(maturities, b0, b1, b2, lam)
    rmse   = np.sqrt(np.mean((fitted - yields) ** 2))
    return {'beta0': round(b0, 4), 'beta1': round(b1, 4),
            'beta2': round(b2, 4), 'lambda': round(lam, 4),
            'RMSE_bps': round(rmse * 10000, 2), 'fitted': fitted}

maturities = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30])
yields     = np.array([0.052, 0.051, 0.049, 0.047, 0.046,
                       0.046, 0.047, 0.048, 0.049, 0.048])
result = fit_ns(maturities, yields)
print({k: v for k, v in result.items() if k != 'fitted'})`,
    explanation:
      "Nelson-Siegel decomposes the yield curve into three economically meaningful factors: beta0 is the long-run level, beta1 is the slope (short vs long rate difference), and beta2 captures the mid-maturity hump. The lambda parameter controls which maturity the hump factor peaks at — central banks use NS to publish benchmark yield curves.",
  },
  {
    id: "pyfin-20260603-b1-ewma-cov",
    language: "python",
    title: "EWMA covariance (RiskMetrics) — exponentially weighted risk matrix",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def ewma_covariance(returns: np.ndarray, lam: float = 0.94) -> tuple:
    """
    RiskMetrics EWMA covariance with decay factor lambda (0.94 for daily, 0.97 for monthly).
    H_t = lambda * H_{t-1} + (1 - lambda) * r_{t-1} * r_{t-1}^T
    Returns final covariance matrix and the series of diagonal volatilities.
    """
    n_obs, n_assets = returns.shape
    H = np.cov(returns[:20].T, ddof=0)   # initialise from first 20 obs
    vols = []

    for t in range(n_obs):
        r = returns[t].reshape(-1, 1)
        H = lam * H + (1 - lam) * (r @ r.T)
        vols.append(np.sqrt(np.diag(H)))

    return H, np.array(vols)

np.random.seed(5)
n, p = 500, 4
rets = np.random.multivariate_normal(
    np.zeros(p),
    np.array([[1.0, 0.6, 0.3, 0.1],
              [0.6, 1.0, 0.4, 0.2],
              [0.3, 0.4, 1.0, 0.5],
              [0.1, 0.2, 0.5, 1.0]]) * 0.01**2,
    n
)

H_final, vol_series = ewma_covariance(rets, lam=0.94)
print("EWMA covariance matrix (annualised):")
print((H_final * 252).round(6))
print("Current daily vols:", vol_series[-1].round(5))`,
    explanation:
      "RiskMetrics EWMA (lambda=0.94) is still widely used in risk systems because it adapts to volatility regimes faster than sample covariance and has only one parameter. The choice of lambda controls the effective half-life: for lambda=0.94, the effective window is log(0.5)/log(0.94) ≈ 11 days. Lower lambda reacts faster but is noisier.",
  },
  {
    id: "pyfin-20260603-b1-johansen-cointegration",
    language: "python",
    title: "Johansen cointegration test — rank of cointegrating space",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
import statsmodels.tsa.vector_ar.vecm as vecm

np.random.seed(42)
n = 500
# Simulate two cointegrated series: share a common stochastic trend.
common_trend = np.cumsum(np.random.normal(0, 1, n))
x1 = common_trend + np.random.normal(0, 0.5, n)
x2 = 1.5 * common_trend + np.random.normal(0, 0.5, n)  # beta=1.5

data = pd.DataFrame({'x1': x1, 'x2': x2})

# Johansen test: null hypothesis = at most r cointegrating vectors.
jtest = vecm.coint_johansen(data, det_order=0, k_ar_diff=1)
print("Trace test statistic vs 95% critical values:")
for i, (stat, cv) in enumerate(zip(jtest.lr1, jtest.cvt[:, 1])):
    print(f"  H0: rank <= {i}: stat={stat:.2f}, 95% CV={cv:.2f}  -> "
          f"{'REJECT' if stat > cv else 'fail to reject'}")

print("\\nMax-eigenvalue test:")
for i, (stat, cv) in enumerate(zip(jtest.lr2, jtest.cvm[:, 1])):
    print(f"  H0: rank =  {i}: stat={stat:.2f}, 95% CV={cv:.2f}  -> "
          f"{'REJECT' if stat > cv else 'fail to reject'}")

# Cointegrating vector (normalised).
print("\\ncointegrating vector:", jtest.evec[:, 0].round(4))`,
    explanation:
      "The Johansen test determines the number of cointegrating relationships (rank) among a set of I(1) series — unlike the Engle-Granger test which only handles the bivariate case. A rank of 1 for two series means one stable linear combination (the spread) is stationary. Use the eigenvectors as the hedge ratios for the long-short pairs trade.",
  },
  {
    id: "pyfin-20260603-b1-dv01-bucketing",
    language: "python",
    title: "DV01 bucketing and key-rate duration — IR risk decomposition",
    tag: "finance",
    code: `import numpy as np
from scipy.interpolate import interp1d

def dv01_bucketing(cashflows: list, times: list, ytm: float,
                   key_tenors: list = None) -> dict:
    """
    Compute DV01 per key-rate tenor bucket via parallel shifts.
    cashflows: list of cash flows (coupon + principal)
    times: corresponding times in years
    Returns DV01 allocated to each key-rate bucket.
    """
    if key_tenors is None:
        key_tenors = [0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30]

    def price(shifts: np.ndarray) -> float:
        """Price under shifted curve: shifts[i] = shift at key_tenor[i]."""
        # Interpolate shift to each cash flow time.
        interp = interp1d(key_tenors, shifts, kind='linear',
                          fill_value=(shifts[0], shifts[-1]),
                          bounds_error=False)
        total = 0.0
        for cf, t in zip(cashflows, times):
            shift  = float(interp(t))
            total += cf * np.exp(-(ytm + shift) * t)
        return total

    base_shifts = np.zeros(len(key_tenors))
    base_price  = price(base_shifts)

    dv01s = {}
    bump  = 1e-4   # 1 basis point
    for i, tenor in enumerate(key_tenors):
        bumped = base_shifts.copy()
        bumped[i] = bump
        dv01s[f"{tenor}Y"] = round((price(bumped) - base_price) / bump, 6)

    return {"base_price": round(base_price, 4), "key_rate_dv01": dv01s}

# 10-year 5% annual coupon bond.
cfs  = [5.0] * 9 + [105.0]
tms  = list(range(1, 11))
ytm  = 0.05
result = dv01_bucketing(cfs, tms, ytm)
print(f"price: {result['base_price']}")
print("key-rate DV01s:", result['key_rate_dv01'])`,
    explanation:
      "Key-rate DV01 decomposes interest-rate sensitivity into contributions from each tenor bucket — crucial for hedging a bond portfolio where a parallel shift assumption is too crude. The 10Y key-rate DV01 of a 10Y bond is large; short tenors contribute little because most cash flows are far from those maturities.",
  },
  {
    id: "pyfin-20260603-b1-tracking-error-opt",
    language: "python",
    title: "Tracking error optimization — minimum TE with alpha tilt",
    tag: "finance",
    code: `import numpy as np
import cvxpy as cp

def min_tracking_error(
    cov: np.ndarray,
    benchmark_weights: np.ndarray,
    alpha: np.ndarray,
    max_te_bps: float = 100.0,
    max_active_weight: float = 0.05,
) -> np.ndarray:
    """
    Maximize alpha subject to:
      - Tracking error (annualised) <= max_te_bps basis points
      - |w - w_bm| <= max_active_weight per stock
      - Fully invested: sum(w) = 1
      - Long-only: w >= 0
    """
    n = len(benchmark_weights)
    w = cp.Variable(n)
    active = w - benchmark_weights

    te_var = cp.quad_form(active, cov * 252)   # annualised TE^2
    te_bps = cp.sqrt(te_var) * 10_000           # in basis points

    prob = cp.Problem(
        cp.Maximize(alpha @ w),
        [
            te_bps <= max_te_bps,
            cp.abs(active) <= max_active_weight,
            cp.sum(w) == 1.0,
            w >= 0,
        ]
    )
    prob.solve(solver=cp.OSQP, warm_start=True)
    return w.value if w.value is not None else benchmark_weights

np.random.seed(9)
n = 20
cov_raw = np.random.randn(n, n)
cov     = cov_raw @ cov_raw.T / n + np.eye(n) * 0.01    # positive definite
bm_w    = np.ones(n) / n                                  # equal-weight benchmark
alpha   = np.random.normal(0.001, 0.005, n)               # daily alpha forecast

opt_w = min_tracking_error(cov, bm_w, alpha, max_te_bps=50.0)
if opt_w is not None:
    active = opt_w - bm_w
    te = np.sqrt(active @ cov @ active * 252) * 10_000
    print(f"TE: {te:.1f} bps")
    print(f"max |active|: {np.abs(active).max():.4f}")
    print(f"expected alpha (daily): {alpha @ opt_w:.6f}")`,
    explanation:
      "Tracking error optimization is the canonical problem for active equity managers running against a benchmark: maximize expected alpha while staying within a TE budget to maintain the mandate. The constraint is a second-order cone constraint (sqrt of quadratic form) which cvxpy handles via SOCP — faster than general QP for this structure.",
  },
];
