import type { Snippet } from "./types";

export const pythonFinanceSnippets20260627B1: Snippet[] = [
  {
    id: "pyfin-20260627-b1-sabr-vol",
    language: "python",
    title: "SABR Model Implied Volatility (Hagan 2002 Approximation)",
    tag: "vol surface",
    code: `import numpy as np
from scipy.optimize import brentq

def sabr_vol(F, K, T, alpha, beta, rho, nu):
    """
    Hagan et al. (2002) SABR implied vol approximation.
    F: forward price, K: strike, T: expiry
    alpha: initial vol, beta: CEV exponent, rho: vol-spot corr, nu: vol-of-vol
    """
    if abs(F - K) < 1e-8:  # ATM limit
        FK_b = F ** (1 - beta)
        term1 = alpha / FK_b
        term2 = 1 + ((1-beta)**2/24 * alpha**2 / FK_b**2
                     + rho*beta*nu*alpha/(4*FK_b)
                     + (2 - 3*rho**2)/24 * nu**2) * T
        return term1 * term2

    log_FK = np.log(F / K)
    FK_mid = (F * K) ** ((1 - beta) / 2)

    z    = nu / alpha * FK_mid * log_FK
    chi  = np.log((np.sqrt(1 - 2*rho*z + z**2) + z - rho) / (1 - rho))

    A = alpha / (FK_mid * (1 + (1-beta)**2/24 * log_FK**2
                            + (1-beta)**4/1920 * log_FK**4))
    B = (z / chi) if abs(chi) > 1e-8 else 1.0
    C = 1 + ((1-beta)**2/24 * alpha**2 / FK_mid**2
             + rho*beta*nu*alpha/(4*FK_mid)
             + (2 - 3*rho**2)/24 * nu**2) * T
    return A * B * C

# Calibrate SABR to market smile
from scipy.optimize import minimize

market_strikes = np.array([90, 95, 100, 105, 110])
market_vols    = np.array([0.25, 0.22, 0.20, 0.21, 0.23])
F, T = 100.0, 1.0

def sabr_error(params):
    alpha, beta, rho, nu = params
    if alpha <= 0 or nu <= 0 or abs(rho) >= 1: return 1e6
    model_vols = [sabr_vol(F, K, T, alpha, beta, rho, nu) for K in market_strikes]
    return np.sum((np.array(model_vols) - market_vols)**2)

result = minimize(sabr_error, [0.2, 0.5, -0.3, 0.4],
                  method='Nelder-Mead',
                  options={'xatol': 1e-7, 'fatol': 1e-9})
alpha, beta, rho, nu = result.x
print(f"SABR params: alpha={alpha:.4f}, beta={beta:.4f}, rho={rho:.4f}, nu={nu:.4f}")`,
    explanation: "The SABR model's key insight is that beta controls the backbone (how ATM vol moves with forward price) while rho governs skew and nu governs smile curvature; the Hagan approximation gives a closed-form expression for implied vol as a function of (F,K,T) that fits the observed market smile with just 4 parameters.",
  },
  {
    id: "pyfin-20260627-b1-nelson-siegel",
    language: "python",
    title: "Nelson-Siegel Term Structure Fitting",
    tag: "rates",
    code: `import numpy as np
from scipy.optimize import minimize

def nelson_siegel(tau, beta0, beta1, beta2, lam):
    """
    Zero-coupon yield for maturity tau.
    beta0: long-run level, beta1: slope (ST-LT spread), beta2: curvature (hump)
    lam: decay parameter controlling where the hump peaks (tau ~ lam)
    """
    x = tau / lam
    loading1 = (1 - np.exp(-x)) / x         # decays to 0 as tau -> inf
    loading2 = loading1 - np.exp(-x)          # hump-shaped
    return beta0 + beta1 * loading1 + beta2 * loading2

# Market data: (maturity in years, observed yield)
maturities = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30])
yields     = np.array([0.052, 0.051, 0.049, 0.045, 0.043, 0.042,
                       0.043, 0.044, 0.046, 0.047])

def fit_loss(params):
    b0, b1, b2, lam = params
    if lam <= 0: return 1e6
    fitted = nelson_siegel(maturities, b0, b1, b2, lam)
    return np.sum((fitted - yields)**2)

x0 = [0.05, -0.02, 0.01, 2.0]
res = minimize(fit_loss, x0, method='Nelder-Mead')
b0, b1, b2, lam = res.x

print("Nelson-Siegel fit:")
fine_tau = np.linspace(0.25, 30, 200)
fitted_curve = nelson_siegel(fine_tau, b0, b1, b2, lam)
print(f"  Long-run level: {b0:.4f}")
print(f"  Slope (ST-LT):  {b1:.4f}")
print(f"  Curvature:      {b2:.4f}")
print(f"  Decay param:    {lam:.4f}")
print(f"  2Y fitted: {nelson_siegel(2, b0, b1, b2, lam):.4f}, obs: {yields[3]:.4f}")`,
    explanation: "Nelson-Siegel is the most widely used parametric yield curve model in central banking (e.g., the ECB and Fed publish NS parameters daily) because its three factors correspond to economically interpretable components: level (parallel shift), slope (monetary policy stance), and curvature (butterfly), making it interpretable as well as flexible.",
  },
  {
    id: "pyfin-20260627-b1-cds-hazard",
    language: "python",
    title: "CDS Pricing via Hazard Rate Bootstrap",
    tag: "credit",
    code: `import numpy as np
from scipy.optimize import brentq

def price_cds(notional, coupon, hazard, recovery, discount, maturities):
    """
    Price a CDS using piecewise-constant hazard rate.
    Premium leg PV = coupon * notional * sum(delta_t * DF(t) * Surv(t))
    Protection leg PV = (1-R) * notional * sum(DF(t) * [Surv(t-1)-Surv(t)])
    """
    surv = np.exp(-hazard * maturities)   # survival probabilities
    df   = np.array([discount(t) for t in maturities])

    dt = np.diff(np.concatenate([[0], maturities]))

    # Premium leg: coupon paid while surviving
    premium_pv = coupon * notional * np.sum(dt * df * surv)

    # Protection leg: pay (1-R) on default
    surv_prev  = np.concatenate([[1.0], surv[:-1]])
    default_probs = surv_prev - surv          # prob of defaulting in [t-1, t]
    protection_pv = (1 - recovery) * notional * np.sum(df * default_probs)

    return protection_pv - premium_pv  # positive => CDS is ITM

# Bootstrap: find hazard rate that makes CDS par (PV = 0)
r = 0.04  # risk-free rate
discount = lambda t: np.exp(-r * t)
mats     = np.array([0.25, 0.5, 1, 2, 3, 5])

par_spread = 0.012  # 120 bps market spread

h = brentq(lambda h: price_cds(1e6, par_spread, h, 0.4, discount, mats),
           0.0001, 0.5)
print(f"Implied hazard rate: {h:.4f} ({h*10000:.1f} bps)")
print(f"5Y survival prob:    {np.exp(-h*5):.4f}")
print(f"Expected loss:       {(1-np.exp(-h*5)) * (1-0.4):.4f}")`,
    explanation: "Bootstrapping the hazard rate from a single par CDS spread gives the risk-neutral default intensity under the assumption that default follows a Poisson process; the hazard rate h satisfies Surv(t) = exp(-h*t), so the implied survival probability and expected loss can be read off directly without simulating default paths.",
  },
  {
    id: "pyfin-20260627-b1-heston-mc",
    language: "python",
    title: "Heston Stochastic Volatility Monte Carlo",
    tag: "derivatives",
    code: `import numpy as np

def heston_mc(S0, K, r, T, kappa, theta, xi, rho, v0,
              n_paths=50000, n_steps=252, seed=42):
    """
    Euler-Maruyama discretization of the Heston (1993) model.
    dS = r*S*dt + sqrt(V)*S*dW1
    dV = kappa*(theta - V)*dt + xi*sqrt(V)*dW2
    Corr(dW1, dW2) = rho
    """
    np.random.seed(seed)
    dt  = T / n_steps
    S   = np.full(n_paths, S0)
    V   = np.full(n_paths, v0)

    for _ in range(n_steps):
        Z1 = np.random.standard_normal(n_paths)
        Z2 = rho * Z1 + np.sqrt(1 - rho**2) * np.random.standard_normal(n_paths)

        V_pos = np.maximum(V, 0)          # full truncation: keep V non-negative
        dV    = kappa * (theta - V_pos) * dt + xi * np.sqrt(V_pos * dt) * Z2
        V     = np.maximum(V_pos + dV, 0) # absorb at zero

        S *= np.exp((r - 0.5 * V_pos) * dt + np.sqrt(V_pos * dt) * Z1)

    payoff = np.maximum(S - K, 0)
    price  = np.exp(-r * T) * payoff.mean()
    se     = np.exp(-r * T) * payoff.std() / np.sqrt(n_paths)
    return price, se

# S&P-like parameters
price, se = heston_mc(
    S0=4500, K=4500, r=0.05, T=0.5,
    kappa=2.0,    # mean-reversion speed
    theta=0.04,   # long-run variance (20% vol)
    xi=0.4,       # vol-of-vol
    rho=-0.7,     # typical negative spot-vol correlation
    v0=0.04       # initial variance (20% vol)
)
print(f"Heston call price: {price:.2f} +/- {1.96*se:.2f} (95% CI)")`,
    explanation: "The full truncation scheme (clipping V to zero before computing sqrt) avoids NaN when variance dips negative under the Euler discretization; the Feller condition (2*kappa*theta > xi^2) guarantees V stays positive in continuous time but is often violated by calibrated parameters, making the truncation fix essential in practice.",
  },
  {
    id: "pyfin-20260627-b1-importance-sampling",
    language: "python",
    title: "Importance Sampling for Deep Out-of-the-Money Options",
    tag: "monte carlo",
    code: `import numpy as np

def bs_call_is(S0, K, r, sigma, T, n_paths=100000, seed=42):
    """
    Price a deep OTM call using importance sampling.
    Standard MC: most paths have zero payoff => high variance.
    IS: shift the drift so paths land near the strike.
    """
    np.random.seed(seed)
    dt = T  # single-step for simplicity

    # Optimal IS drift: shift mean of log(S_T) to center at log(K)
    log_S0 = np.log(S0)
    mu_orig = (r - 0.5 * sigma**2) * dt
    mu_tgt  = np.log(K / S0)        # shift so E[log S_T] = log K

    mu_shift = mu_tgt - mu_orig      # amount to shift the normal mean

    # Sample from shifted distribution
    Z      = np.random.standard_normal(n_paths)
    logS_T = log_S0 + mu_tgt + sigma * np.sqrt(dt) * Z  # IS distribution
    S_T    = np.exp(logS_T)

    payoff = np.maximum(S_T - K, 0)

    # Likelihood ratio: correct for distribution change (Radon-Nikodym derivative)
    lr = np.exp(-mu_shift / (sigma**2 * dt) * (logS_T - log_S0 - mu_orig)
                - mu_shift**2 / (2 * sigma**2 * dt))

    weighted_payoff = payoff * lr
    price_is  = np.exp(-r * T) * weighted_payoff.mean()
    se_is     = np.exp(-r * T) * weighted_payoff.std() / np.sqrt(n_paths)

    # Compare to naive MC
    Z2     = np.random.standard_normal(n_paths)
    S_T2   = S0 * np.exp(mu_orig + sigma * np.sqrt(dt) * Z2)
    price_mc = np.exp(-r * T) * np.maximum(S_T2 - K, 0).mean()

    return price_is, se_is, price_mc

K = 130  # 30% OTM
price, se, price_mc = bs_call_is(100, K, 0.05, 0.2, 1.0)
print(f"IS price: {price:.6f} +/- {se:.6f}")
print(f"Naive MC: {price_mc:.6f} (much higher variance)")`,
    explanation: "For deep OTM options with probability of finishing in-the-money of 1% or less, standard MC needs 10,000x more paths to achieve the same standard error as IS; the likelihood ratio (Radon-Nikodym derivative) exactly corrects for the distribution shift, so the IS estimator is unbiased while achieving variance reduction proportional to the rarity of the event.",
  },
  {
    id: "pyfin-20260627-b1-evt-gpd",
    language: "python",
    title: "Extreme Value Theory: GPD Tail Risk Estimation",
    tag: "risk",
    code: `import numpy as np
from scipy.stats import genpareto
from scipy.optimize import minimize

def fit_gpd_tail(losses, threshold_quantile=0.90):
    """
    Fit a Generalized Pareto Distribution to tail losses above threshold.
    EVT justification: POT (Peaks-over-Threshold) theorem states that
    excess losses over a high threshold converge to GPD as threshold -> infty.
    """
    u = np.quantile(losses, threshold_quantile)
    excesses = losses[losses > u] - u   # excesses over threshold

    # MLE fit: GPD has shape xi and scale sigma
    # xi > 0: heavy tail (Pareto), xi = 0: exponential, xi < 0: bounded
    xi, _, sigma = genpareto.fit(excesses, floc=0)  # fix location at 0

    n = len(losses)
    Nu = len(excesses)   # number of threshold exceedances

    def var_gpd(p):
        # VaR at confidence level p (e.g., p=0.999)
        # = u + (sigma/xi) * [(n/Nu * (1-p))^(-xi) - 1]
        if abs(xi) < 1e-6:
            return u + sigma * np.log(n / Nu * (1 - p))
        return u + sigma / xi * ((n / Nu * (1 - p))**(-xi) - 1)

    def es_gpd(p):
        # Expected Shortfall = VaR/(1-xi) + (sigma - xi*u)/(1-xi)
        v = var_gpd(p)
        if abs(xi) < 1e-6:
            return v + sigma
        return v / (1 - xi) + (sigma - xi * u) / (1 - xi)

    return xi, sigma, u, var_gpd, es_gpd

np.random.seed(42)
# Simulate fat-tailed daily P&L (Student-t with 3 df)
from scipy.stats import t as t_dist
losses = -t_dist.rvs(df=3, size=2000, random_state=42) * 0.01 * 1e6

xi, sigma, u, var_fn, es_fn = fit_gpd_tail(losses, 0.90)
print(f"GPD shape xi={xi:.4f} (>0 means heavy tail), scale sigma={sigma:.2f}")
print(f"99.9% VaR:  \${var_fn(0.999):,.0f}")
print(f"99.9% ES:   \${es_fn(0.999):,.0f}")`,
    explanation: "The Pickands-Balkema-de Haan theorem (the POT theorem) is EVT's core result: regardless of the underlying return distribution, tail excesses above a high threshold converge in distribution to the GPD — this makes GPD a model-free tail estimator that outperforms historical simulation or Gaussian VaR for capturing fat tails.",
  },
  {
    id: "pyfin-20260627-b1-gaussian-copula",
    language: "python",
    title: "Gaussian Copula Portfolio Loss Simulation",
    tag: "credit",
    code: `import numpy as np
from scipy.stats import norm
from scipy.linalg import cholesky

def gaussian_copula_loss(pd_vec, lgd_vec, notionals, corr_matrix,
                         n_sims=100000, seed=42):
    """
    Simulate portfolio credit loss using the Gaussian copula.
    Each obligor i defaults when X_i < N^{-1}(PD_i) where X = L @ Z,
    L is the Cholesky factor of the correlation matrix, Z ~ N(0,I).
    """
    np.random.seed(seed)
    n = len(pd_vec)
    L = cholesky(corr_matrix, lower=True)   # LL' = Sigma

    # Gaussian copula: generate correlated uniforms via normal mapping
    Z       = np.random.standard_normal((n_sims, n))   # independent normals
    X       = Z @ L.T                                   # correlated normals
    thresholds = norm.ppf(pd_vec)                       # N^-1(PD_i)

    # Default indicators: obligor i defaults if X[sim, i] < threshold[i]
    defaults = X < thresholds[np.newaxis, :]            # (n_sims, n) boolean

    # Portfolio loss per simulation
    loss_given_default = lgd_vec * notionals
    losses = (defaults * loss_given_default[np.newaxis, :]).sum(axis=1)

    return losses

# 5-obligor example
pd_vec     = np.array([0.01, 0.02, 0.015, 0.03, 0.025])   # 1-3% annual PD
lgd_vec    = np.array([0.6, 0.6, 0.6, 0.6, 0.6])          # 60% LGD
notionals  = np.array([1e6, 2e6, 1.5e6, 1e6, 2.5e6])
rho        = 0.3                                             # pairwise correlation
corr       = rho * np.ones((5,5)) + (1-rho) * np.eye(5)   # equi-correlated

losses = gaussian_copula_loss(pd_vec, lgd_vec, notionals, corr)
print(f"Expected loss: \${losses.mean():,.0f}")
print(f"99% VaR:       \${np.percentile(losses, 99):,.0f}")
print(f"99.9% VaR:     \${np.percentile(losses, 99.9):,.0f}")`,
    explanation: "The Gaussian copula became infamous after the 2008 crisis because high asset correlation assumptions dramatically increased the probability of joint defaults; the copula approach separates the marginal default probability (modeled by ratings) from the joint dependence structure (modeled by the correlation matrix), making each component calibratable independently.",
  },
  {
    id: "pyfin-20260627-b1-fama-french",
    language: "python",
    title: "Fama-French 3-Factor Alpha Estimation",
    tag: "factor models",
    code: `import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression

# Fama-French 3-Factor model:
# R_i - Rf = alpha + beta_mkt*(Rm-Rf) + beta_smb*SMB + beta_hml*HML + e
# alpha = Jensen's alpha (risk-adjusted excess return)
# SMB = Small Minus Big (size premium)
# HML = High Minus Low (value premium)

np.random.seed(42)
n = 252  # 1 year of daily returns

# Simulate factor returns
Rf  = 0.04 / 252                         # daily risk-free
MKT = np.random.normal(0.07/252, 0.15/np.sqrt(252), n)  # market excess return
SMB = np.random.normal(0.03/252, 0.08/np.sqrt(252), n)
HML = np.random.normal(0.04/252, 0.09/np.sqrt(252), n)

# Simulate a portfolio with known factor exposures + alpha
true_alpha    = 0.02 / 252   # 2% annualized alpha
true_betas    = [1.1, 0.3, 0.4]
port_excess   = (true_alpha +
                 true_betas[0]*MKT +
                 true_betas[1]*SMB +
                 true_betas[2]*HML +
                 np.random.normal(0, 0.01, n))  # idiosyncratic noise

X = np.column_stack([MKT, SMB, HML])
model = LinearRegression().fit(X, port_excess)

alpha_daily   = model.intercept_
alpha_annual  = alpha_daily * 252
betas         = model.coef_
resid         = port_excess - model.predict(X)
r_squared     = model.score(X, port_excess)
info_ratio    = alpha_daily / resid.std()  # daily IR

print(f"Estimated alpha: {alpha_annual:.4f} ({alpha_annual*100:.2f}% annual)")
print(f"True alpha:      {true_alpha*252:.4f}")
print(f"Beta_MKT={betas[0]:.3f}, Beta_SMB={betas[1]:.3f}, Beta_HML={betas[2]:.3f}")
print(f"R^2: {r_squared:.3f}, Information Ratio: {info_ratio*np.sqrt(252):.3f}")`,
    explanation: "The Fama-French 3-factor model shows that much of the apparent alpha in small-cap and value strategies is actually beta to the SMB and HML factors; a fund claiming 5% alpha that loads heavily on HML might only have 1-2% true alpha once the value-factor beta is accounted for, which is why factor-adjusted alpha is the standard for hedge fund manager evaluation.",
  },
  {
    id: "pyfin-20260627-b1-arima-forecast",
    language: "python",
    title: "ARIMA Return Forecast with statsmodels",
    tag: "time series",
    code: `import numpy as np
import pandas as pd
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.stats.diagnostic import acorr_ljungbox
import warnings
warnings.filterwarnings('ignore')

np.random.seed(42)
n = 500

# Simulate AR(1) return process with drift
phi   = 0.15   # autocorrelation
mu    = 0.0003 # daily drift
sigma = 0.01
eps   = np.random.normal(0, sigma, n)
r     = np.zeros(n)
r[0]  = mu + eps[0]
for t in range(1, n):
    r[t] = mu + phi * r[t-1] + eps[t]

series = pd.Series(r)

# Fit ARIMA(1,0,0) — equivalent to AR(1) for stationary returns
model  = ARIMA(series, order=(1, 0, 0))
result = model.fit()

print(result.summary().tables[1])
phi_hat  = result.params['ar.L1']
mu_hat   = result.params['const']
print(f"\\nEstimated phi: {phi_hat:.4f} (true: {phi})")
print(f"Estimated mu:  {mu_hat:.6f} (true: {mu})")

# Ljung-Box test: residuals should be white noise
lb = acorr_ljungbox(result.resid, lags=10, return_df=True)
print(f"Ljung-Box p-values (all >0.05 => no autocorrelation in residuals):")
print(lb['lb_pvalue'].round(3).values)

# 5-step ahead forecast
forecast = result.get_forecast(steps=5)
print(f"\\n5-day ahead return forecasts:")
print(forecast.predicted_mean.values)`,
    explanation: "ARIMA models for returns are weak predictors (R^2 typically <1%) because prices are close to martingales, but they are useful for detecting mean-reversion in spreads or basis trades; the Ljung-Box test is essential to verify that residuals are white noise — failing it means the model order is misspecified and there are unexploited autocorrelations.",
  },
  {
    id: "pyfin-20260627-b1-dupire-localvol",
    language: "python",
    title: "Dupire Local Volatility from IV Surface",
    tag: "vol surface",
    code: `import numpy as np
from scipy.interpolate import RectBivariateSpline

def dupire_local_vol(K_grid, T_grid, iv_surface, r=0.05, q=0.0, S0=100.0):
    """
    Dupire (1994) formula: sigma_loc^2(K,T) = numerator / denominator
    numerator   = dC/dT + (r-q)*K*dC/dK + q*C
    denominator = 0.5*K^2 * d2C/dK2
    Using call prices interpolated from the IV surface.
    """
    from scipy.stats import norm

    def bs_call(S, K, r, sigma, T, q=0.0):
        if T <= 0 or sigma <= 0: return max(S - K, 0)
        d1 = (np.log(S/K) + (r - q + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
        d2 = d1 - sigma*np.sqrt(T)
        return S*np.exp(-q*T)*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

    # Build call price surface
    C = np.zeros((len(T_grid), len(K_grid)))
    for i, T in enumerate(T_grid):
        for j, K in enumerate(K_grid):
            sig = iv_surface[i, j]
            C[i, j] = bs_call(S0, K, r, sig, T, q)

    # Spline interpolation for smooth derivatives
    spline = RectBivariateSpline(T_grid, K_grid, C, kx=3, ky=3)

    # Evaluate local vol at interior grid points (avoid boundaries)
    K_mid = K_grid[2:-2]
    T_mid = T_grid[1:-1]
    local_vol = np.zeros((len(T_mid), len(K_mid)))
    for i, T in enumerate(T_mid):
        for j, K in enumerate(K_mid):
            dCdT  = spline(T, K, dx=1, dy=0)[0, 0]
            dCdK  = spline(T, K, dx=0, dy=1)[0, 0]
            d2CdK = spline(T, K, dx=0, dy=2)[0, 0]
            num   = dCdT + (r - q) * K * dCdK + q * spline(T, K)[0, 0]
            den   = 0.5 * K**2 * d2CdK
            local_vol[i, j] = np.sqrt(max(num / den, 0)) if den > 1e-8 else 0
    return local_vol, K_mid, T_mid

# Example: flat IV surface => local vol = constant
K_grid = np.linspace(80, 120, 20)
T_grid = np.linspace(0.1, 2.0, 10)
iv_flat = np.full((len(T_grid), len(K_grid)), 0.20)  # 20% flat

lv, Km, Tm = dupire_local_vol(K_grid, T_grid, iv_flat)
print(f"Local vol range (should be ~0.20): {lv[lv>0].min():.4f} - {lv[lv>0].max():.4f}")`,
    explanation: "Dupire's formula inverts the Black-Scholes pricing operator to extract the unique local vol surface that exactly fits all European option prices — it's the 'perfect' static hedge, but it requires a smooth, arbitrage-free IV surface as input; in practice, sparse or noisy market quotes create butterfly-arbitrage violations that make the denominator negative, requiring regularization.",
  },
  {
    id: "pyfin-20260627-b1-hull-white",
    language: "python",
    title: "Hull-White Short Rate Model: Calibration and Simulation",
    tag: "rates",
    code: `import numpy as np
from scipy.optimize import minimize_scalar

def hull_white_sim(a, sigma, theta_t, r0, T, n_steps, n_paths, seed=42):
    """
    Hull-White model: dr = [theta(t) - a*r]*dt + sigma*dW
    Euler-Maruyama discretization.
    theta(t) calibrated to match initial term structure.
    """
    np.random.seed(seed)
    dt = T / n_steps
    t_grid = np.linspace(0, T, n_steps + 1)

    r = np.full(n_paths, r0)
    rates = np.zeros((n_steps + 1, n_paths))
    rates[0] = r0

    for i in range(n_steps):
        t = t_grid[i]
        theta = np.interp(t, *theta_t)   # piecewise-linear theta(t)
        dW = np.random.standard_normal(n_paths) * np.sqrt(dt)
        r  = r + (theta - a * r) * dt + sigma * dW
        rates[i + 1] = r

    return rates, t_grid

def calibrate_theta(a, sigma, f0_curve, dt=0.01):
    """
    Exact theta(t) that reproduces initial forward curve f(0,t).
    theta(t) = df/dt + a*f(0,t) + sigma^2/(2a) * (1 - exp(-2a*t))
    """
    mats = f0_curve[0]
    f0   = f0_curve[1]
    # Numerical derivative of forward curve
    dfdt  = np.gradient(f0, mats)
    theta = dfdt + a * f0 + (sigma**2 / (2*a)) * (1 - np.exp(-2*a*mats))
    return mats, theta

# Flat initial term structure at 4%
mats  = np.linspace(0.01, 5, 200)
f0    = np.full_like(mats, 0.04)          # flat forward curve
a, sigma = 0.1, 0.01

theta_mats, theta_vals = calibrate_theta(a, sigma, (mats, f0))
rates, t_grid = hull_white_sim(a, sigma, (theta_mats, theta_vals),
                                r0=0.04, T=5, n_steps=500, n_paths=1000)

print(f"Mean terminal rate: {rates[-1].mean():.4f} (expected ~0.04)")
print(f"Std of rates:       {rates[-1].std():.4f}")
# Zero-coupon bond price P(0,T) = E[exp(-integral r dt)]
int_r = rates.mean(axis=1) * (t_grid[1] - t_grid[0])
P_sim = np.exp(-int_r.cumsum()[-1] * 5)
print(f"5Y ZCB price:       {P_sim:.4f}")`,
    explanation: "Hull-White is analytically tractable (bond prices and swaption prices have closed forms) while fitting the initial term structure exactly via theta(t); the exact calibration formula for theta shows that it absorbs the slope of the forward curve plus a convexity adjustment proportional to sigma^2/(2a), explaining why high-vol or low-mean-reversion environments produce large theta bumps.",
  },
  {
    id: "pyfin-20260627-b1-kelly",
    language: "python",
    title: "Kelly Criterion Position Sizing",
    tag: "portfolio",
    code: `import numpy as np
from scipy.optimize import minimize_scalar

def kelly_fraction(win_prob, win_loss_ratio):
    """Classic Kelly for binary bets: f* = p - q/b"""
    p = win_prob
    q = 1 - p
    b = win_loss_ratio  # gain per unit risked when winning
    return p - q / b

def kelly_continuous(mu, sigma, r=0.0):
    """
    Kelly fraction for continuous log-normal asset.
    Maximizes E[log(W_T)]; solution: f* = (mu - r) / sigma^2
    This is the Sharpe ratio divided by sigma.
    """
    return (mu - r) / sigma**2

def fractional_kelly_portfolio(mu_vec, cov_matrix, r=0.0, fraction=0.5):
    """
    Multi-asset Kelly: maximize E[log W] = w'mu - r - 0.5*w'*Sigma*w
    Solution: w* = Sigma^{-1} * (mu - r*1) (unconstrained)
    Fractional Kelly: use fraction * w* to reduce variance.
    """
    mu_excess = mu_vec - r
    Sigma_inv  = np.linalg.inv(cov_matrix)
    w_full     = Sigma_inv @ mu_excess       # full Kelly
    w_frac     = fraction * w_full           # half-Kelly reduces ruin risk

    # Portfolio statistics
    port_mu    = w_frac @ mu_vec
    port_sigma = np.sqrt(w_frac @ cov_matrix @ w_frac)
    port_sharpe= (port_mu - r) / port_sigma

    return w_frac, port_mu, port_sigma, port_sharpe

# Example: 3-asset portfolio
mu    = np.array([0.12, 0.10, 0.08])
sigma = np.array([0.20, 0.15, 0.10])
rho   = np.array([[1.0, 0.3, 0.1],
                   [0.3, 1.0, 0.2],
                   [0.1, 0.2, 1.0]])
cov   = np.diag(sigma) @ rho @ np.diag(sigma)

w, mu_p, sig_p, sharpe = fractional_kelly_portfolio(mu, cov, r=0.04, fraction=0.5)
print(f"Half-Kelly weights: {w.round(4)}")
print(f"Expected return: {mu_p:.4f}, Vol: {sig_p:.4f}, Sharpe: {sharpe:.4f}")
print(f"Leverage: {abs(w).sum():.2f}x")`,
    explanation: "Full Kelly maximizes long-run geometric growth rate but leads to severe drawdowns (up to 50% drawdown is common even on favorable bets); half-Kelly sacrifices roughly 25% of long-run growth to cut variance by 75%, which is why most practitioners use fractional Kelly as a pragmatic balance between growth and drawdown control.",
  },
  {
    id: "pyfin-20260627-b1-slippage-backtest",
    language: "python",
    title: "Slippage and Market Impact Backtest Engine",
    tag: "backtesting",
    code: `import numpy as np
import pandas as pd

class BacktestEngine:
    """
    Simulates a simple momentum strategy with realistic transaction costs.
    Slippage model: linear market impact + half-spread.
    """
    def __init__(self, spread_bps=2.0, impact_coef=0.1, commission_bps=1.0):
        self.spread_bps = spread_bps / 10000
        self.impact     = impact_coef   # vol * sqrt(size / ADV) for square-root impact
        self.commission = commission_bps / 10000

    def slippage(self, price, size_pct_adv, daily_vol, direction):
        """
        Total slippage = half-spread + market impact (square-root model).
        direction: +1 for buy, -1 for sell.
        """
        half_spread   = self.spread_bps / 2 * price
        impact_cost   = self.impact * daily_vol * np.sqrt(size_pct_adv) * price
        return direction * (half_spread + impact_cost)

    def run(self, prices, signals, adv_pct=0.01, daily_vol=0.01):
        """
        prices:  pd.Series of prices
        signals: pd.Series of target weights (-1, 0, +1)
        """
        n           = len(prices)
        position    = np.zeros(n)   # shares held
        cash        = 1e6
        portfolio_v = np.zeros(n)

        for i in range(1, n):
            price = prices.iloc[i]
            prev_pos = position[i-1] if i > 0 else 0

            # Target dollar position
            target_shares = signals.iloc[i] * (cash + prev_pos * price) / price
            trade         = target_shares - prev_pos
            direction     = np.sign(trade)
            size_pct      = abs(trade) * price / (adv_pct * 1e6 + 1e-8)

            slip  = self.slippage(price, size_pct, daily_vol, direction)
            cost  = abs(trade) * (slip + self.commission * price)
            cash -= trade * price + cost

            position[i]    = target_shares
            portfolio_v[i] = position[i] * price + cash

        returns = pd.Series(portfolio_v).pct_change().dropna()
        sharpe  = returns.mean() / returns.std() * np.sqrt(252)
        return portfolio_v, sharpe

np.random.seed(42)
n = 500
prices  = pd.Series(100 * np.cumprod(1 + np.random.normal(0.0003, 0.01, n)))
# Simple momentum signal: sign of 20-day return
mom     = prices.pct_change(20).apply(np.sign).fillna(0)

engine  = BacktestEngine(spread_bps=2, impact_coef=0.1, commission_bps=1)
pv, sharpe = engine.run(prices, mom)
print(f"Annualized Sharpe: {sharpe:.3f}")
print(f"Final portfolio value: \${pv[-1]:,.0f}")`,
    explanation: "The square-root market impact model (impact ∝ sigma * sqrt(order_size/ADV)) is empirically validated across asset classes and captures the key nonlinearity: doubling trade size increases impact by only 41%, so breaking large orders into smaller pieces is always beneficial up to a fixed transaction cost per trade.",
  },
  {
    id: "pyfin-20260627-b1-pca-yield",
    language: "python",
    title: "PCA Decomposition of Yield Curve Movements",
    tag: "rates",
    code: `import numpy as np
from sklearn.decomposition import PCA
import pandas as pd

np.random.seed(42)
# Simulate correlated daily yield changes across 10 tenors
tenors = [0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30]
n_obs  = 500

# Realistic yield curve covariance: short end more volatile, highly correlated
cov = np.zeros((10, 10))
for i in range(10):
    for j in range(10):
        # Correlation decays with tenor distance; short-end vol is higher
        vol_i = 0.006 * np.exp(-0.05 * tenors[i]) + 0.001
        vol_j = 0.006 * np.exp(-0.05 * tenors[j]) + 0.001
        corr  = np.exp(-0.3 * abs(np.log(tenors[i]/tenors[j])))
        cov[i, j] = vol_i * vol_j * corr

dY = np.random.multivariate_normal(np.zeros(10), cov, n_obs)

# PCA
pca = PCA()
pca.fit(dY)

exp_var = pca.explained_variance_ratio_
cum_var = np.cumsum(exp_var)
print("Explained variance by PC:")
for i, (ev, cv) in enumerate(zip(exp_var[:5], cum_var[:5])):
    print(f"  PC{i+1}: {ev:.1%} (cumulative: {cv:.1%})")

# Interpret first 3 PCs
print("\\nPC1 loadings (Level/Parallel shift):", pca.components_[0].round(3))
print("PC2 loadings (Slope/Twist):",           pca.components_[1].round(3))
print("PC3 loadings (Curvature/Butterfly):",   pca.components_[2].round(3))

# Reconstruct with 3 PCs
scores       = pca.transform(dY)[:, :3]
reconstructed = scores @ pca.components_[:3]
residual_var  = np.var(dY - reconstructed) / np.var(dY)
print(f"\\nResidual variance with 3 PCs: {residual_var:.4f}")`,
    explanation: "The empirical finding that 3 PCs explain 95%+ of yield curve variance is remarkably stable across markets and time periods; PC1 (level) is the dominant driver and explains ~80%, PC2 (slope) captures monetary policy pivots, and PC3 (butterfly) represents relative value between the belly and the wings — these components form the basis of most fixed income relative-value strategies.",
  },
  {
    id: "pyfin-20260627-b1-engle-granger",
    language: "python",
    title: "Engle-Granger Cointegration Test for Pairs Trading",
    tag: "stat arb",
    code: `import numpy as np
import pandas as pd
from statsmodels.tsa.stattools import coint, adfuller
from statsmodels.regression.linear_model import OLS
from statsmodels.tools.tools import add_constant

np.random.seed(42)
n = 500

# Generate cointegrated pair: spread is mean-reverting
# P1 = random walk; P2 = beta * P1 + stationary spread
common_factor = np.cumsum(np.random.normal(0, 1, n))   # I(1) common trend
beta_true     = 1.5
spread_true   = 0.3 * np.random.normal(0, 1, n)        # AR(1) spread
spread_true[0] = 0
for t in range(1, n):
    spread_true[t] = 0.85 * spread_true[t-1] + np.random.normal(0, 0.3)

P1 = common_factor + np.random.normal(0, 0.5, n)
P2 = beta_true * common_factor + spread_true

# Step 1: Engle-Granger cointegration test
score, pvalue, _ = coint(P1, P2)
print(f"Cointegration test p-value: {pvalue:.4f} ({'reject no-coint' if pvalue < 0.05 else 'fail to reject'})")

# Step 2: Estimate hedge ratio via OLS
X   = add_constant(P1)
ols = OLS(P2, X).fit()
beta_est = ols.params[1]
spread   = P2 - beta_est * P1 - ols.params[0]

print(f"Estimated beta: {beta_est:.4f} (true: {beta_true})")

# Step 3: ADF test on the spread (should be stationary)
adf_stat, adf_pval, *_ = adfuller(spread, maxlags=1)
print(f"ADF on spread: stat={adf_stat:.4f}, p={adf_pval:.4f}")
print(f"Spread is {'stationary' if adf_pval < 0.05 else 'non-stationary (not cointegrated!)'}")

# Step 4: Z-score based signals
z = (spread - spread.mean()) / spread.std()
long_entries  = (z < -2).sum()
short_entries = (z >  2).sum()
print(f"Long entries: {long_entries}, Short entries: {short_entries}")`,
    explanation: "The Engle-Granger two-step procedure first estimates the cointegrating vector (hedge ratio) via OLS, then tests whether the residual spread is stationary via ADF; the key pitfall is that the ADF critical values for a residual series are more negative than standard ADF critical values because the hedge ratio itself is estimated, requiring corrected Engle-Granger critical values rather than MacKinnon standard ones.",
  },
  {
    id: "pyfin-20260627-b1-garch",
    language: "python",
    title: "GARCH(1,1) Volatility Forecast",
    tag: "vol modeling",
    code: `import numpy as np
from scipy.optimize import minimize

def garch_loglik(params, returns):
    """GARCH(1,1) log-likelihood: h_t = omega + alpha*r_{t-1}^2 + beta*h_{t-1}"""
    omega, alpha, beta = params
    if omega <= 0 or alpha < 0 or beta < 0 or alpha + beta >= 1:
        return 1e10   # constraint violation

    n = len(returns)
    h = np.zeros(n)
    h[0] = np.var(returns)  # initialize with unconditional variance

    for t in range(1, n):
        h[t] = omega + alpha * returns[t-1]**2 + beta * h[t-1]

    # Gaussian log-likelihood
    ll = -0.5 * np.sum(np.log(h) + returns**2 / h)
    return -ll  # minimize negative log-likelihood

np.random.seed(42)
n = 1000
# Simulate GARCH(1,1) returns
omega_true, alpha_true, beta_true = 0.0002, 0.1, 0.85
h  = np.zeros(n); h[0] = omega_true / (1 - alpha_true - beta_true)
r  = np.zeros(n)
for t in range(1, n):
    h[t] = omega_true + alpha_true * r[t-1]**2 + beta_true * h[t-1]
    r[t] = np.random.normal(0, np.sqrt(h[t]))

# Fit
x0  = [0.0001, 0.05, 0.9]
res = minimize(garch_loglik, x0, args=(r,), method='L-BFGS-B',
               bounds=[(1e-6, None), (0, 1), (0, 1)])
omega, alpha, beta = res.x

# Multi-step ahead vol forecast: h_{T+k} = omega/(1-alpha-beta) + (alpha+beta)^k * (h_T - unc_var)
unc_var = omega / (1 - alpha - beta)
h_T     = omega + alpha * r[-1]**2 + beta * (r[-1]**2)  # simplification
forecasts = [np.sqrt(unc_var + (alpha + beta)**k * (h_T - unc_var))
             for k in range(1, 11)]

print(f"GARCH params: omega={omega:.6f}, alpha={alpha:.4f}, beta={beta:.4f}")
print(f"Persistence: {alpha+beta:.4f} (true: {alpha_true+beta_true})")
print(f"Unconditional vol: {np.sqrt(unc_var)*np.sqrt(252):.2%} annual")
print(f"10-day vol forecast: {[f'{v*np.sqrt(252):.2%}' for v in forecasts[:5]]}")`,
    explanation: "GARCH(1,1) persistence (alpha + beta) near 1 implies slow mean-reversion of variance — a volatility spike today decays only gradually, explaining why implied vols remain elevated long after a shock; the multi-step forecast formula shows that GARCH converges to the unconditional variance as k → ∞, with the convergence speed determined by (alpha+beta).",
  },
  {
    id: "pyfin-20260627-b1-control-variate",
    language: "python",
    title: "Control Variate MC: Geometric Asian as CV for Arithmetic Asian",
    tag: "monte carlo",
    code: `import numpy as np
from scipy.stats import norm

def geometric_asian_call(S0, K, r, sigma, T, n):
    """Kemna-Vorst closed form for geometric Asian call."""
    sigma_g = sigma * np.sqrt((2*n + 1) / (6*(n + 1)))
    r_g     = 0.5 * (r - 0.5*sigma**2 + sigma_g**2)
    d1 = (np.log(S0/K) + (r_g + 0.5*sigma_g**2)*T) / (sigma_g*np.sqrt(T))
    d2 = d1 - sigma_g*np.sqrt(T)
    return np.exp(-r*T) * (S0*np.exp(r_g*T)*norm.cdf(d1) - K*norm.cdf(d2))

def asian_call_cv(S0, K, r, sigma, T, steps, n_paths, seed=42):
    """
    MC for arithmetic Asian call using geometric Asian as control variate.
    E[arith] = E[arith - c*(geom - E[geom])]  for any c
    Optimal c = Cov(arith, geom) / Var(geom)
    """
    np.random.seed(seed)
    dt = T / steps
    mu = (r - 0.5*sigma**2)*dt
    vol = sigma*np.sqrt(dt)

    S = np.full(n_paths, S0)
    arith_sums = np.zeros(n_paths)
    log_sums   = np.zeros(n_paths)

    for _ in range(steps):
        Z  = np.random.standard_normal(n_paths)
        S *= np.exp(mu + vol*Z)
        arith_sums += S
        log_sums   += np.log(S)

    A = arith_sums / steps                       # arithmetic average
    G = np.exp(log_sums / steps)                 # geometric average (log trick)

    payoff_arith = np.exp(-r*T) * np.maximum(A - K, 0)
    payoff_geom  = np.exp(-r*T) * np.maximum(G - K, 0)
    E_geom_exact = geometric_asian_call(S0, K, r, sigma, T, steps)

    # Estimate optimal c
    c = np.cov(payoff_arith, payoff_geom)[0, 1] / np.var(payoff_geom)
    cv_estimator = payoff_arith - c * (payoff_geom - E_geom_exact)

    return cv_estimator.mean(), cv_estimator.std() / np.sqrt(n_paths)

price, se = asian_call_cv(100, 100, 0.05, 0.20, 1.0, 52, 50000)
price_naive = None
# Naive estimate for comparison
np.random.seed(42)
S = np.full(50000, 100.0)
avg = np.zeros(50000)
for _ in range(52):
    S *= np.exp((0.05-0.5*0.04)/52 + 0.20*np.sqrt(1/52)*np.random.randn(50000))
    avg += S
avg /= 52
price_naive_val = np.exp(-0.05) * np.maximum(avg - 100, 0)
print(f"CV price: {price:.4f} +/- {se:.6f}")
print(f"Naive SE: {price_naive_val.std()/np.sqrt(50000):.6f}")
print(f"Variance reduction: {(price_naive_val.std()/np.sqrt(50000)/se)**2:.1f}x")`,
    explanation: "The geometric Asian is the ideal control variate for the arithmetic Asian because both averages are computed on the same price path, making them highly correlated (typically rho > 0.99); this correlation directly determines the variance reduction factor 1/(1-rho^2), which exceeds 100x for deep ITM options where the geometric and arithmetic averages almost coincide.",
  },
  {
    id: "pyfin-20260627-b1-bdt-tree",
    language: "python",
    title: "Black-Derman-Toy Binomial Interest Rate Tree",
    tag: "rates",
    code: `import numpy as np
from scipy.optimize import brentq

def build_bdt_tree(market_yields, market_vols, n_steps):
    """
    BDT tree: r(i,j) = r(i,0) * exp(sigma_i * j * sqrt(dt))
    Calibrate r(i,0) at each step so ZCB prices match market yields.
    dt = 1 year between steps.
    """
    dt   = 1.0
    tree = [[None] * (i + 1) for i in range(n_steps)]

    def zcb_price(step, rates_at_step):
        """Backward induction: price ZCB maturing at step+1."""
        prices = np.ones(step + 1)
        for s in range(step - 1, -1, -1):
            new_prices = np.zeros(s + 1)
            for j in range(s + 1):
                r_sj = tree[s][j]
                new_prices[j] = 0.5 * (prices[j] + prices[j+1]) / (1 + r_sj * dt)
            prices = new_prices
        return prices[0]

    # Step 0: short rate = 1-year yield
    r0 = market_yields[0]
    tree[0][0] = r0

    # Calibrate each subsequent step
    for i in range(1, n_steps):
        sigma_i = market_vols[i]
        target  = np.exp(-market_yields[i] * (i + 1) * dt)

        def objective(r_low):
            # Fill this level of the tree
            for j in range(i + 1):
                tree[i][j] = r_low * np.exp(sigma_i * j * np.sqrt(dt))
            return zcb_price(i, tree[i]) - target

        r_low = brentq(objective, 1e-6, 0.5)
        for j in range(i + 1):
            tree[i][j] = r_low * np.exp(sigma_i * j * np.sqrt(dt))

    return tree

# Example calibration
market_yields = [0.03, 0.035, 0.038, 0.040, 0.042]  # 1-5Y par yields
market_vols   = [0.00, 0.20,  0.19,  0.18,  0.17 ]  # short rate vol

tree = build_bdt_tree(market_yields, market_vols, 5)
print("BDT short rate tree (annual rates):")
for i, row in enumerate(tree):
    rates = [f"{r:.4f}" for r in row]
    print(f"  Year {i}: {rates}")`,
    explanation: "The BDT tree calibrates to both the yield curve (level) and cap/floor volatilities (shape of the tree spread), making it a two-factor model in practice; unlike Ho-Lee which produces normally distributed rates, BDT's log-normal structure guarantees non-negative rates, which was the key advantage before negative rates became common post-2008.",
  },
  {
    id: "pyfin-20260627-b1-cva",
    language: "python",
    title: "CVA (Credit Valuation Adjustment) via Monte Carlo",
    tag: "credit",
    code: `import numpy as np

def compute_cva(V0, r, sigma_V, T, notional,
                hazard_rate, recovery, n_steps=52, n_paths=50000, seed=42):
    """
    CVA = (1 - R) * integral_0^T PD(t) * EE(t) * DF(t) dt
    EE(t) = Expected Exposure = E[max(V(t), 0)]
    PD(t) = hazard_rate * exp(-hazard_rate * t) * dt
    """
    np.random.seed(seed)
    dt = T / n_steps
    t_grid = np.linspace(dt, T, n_steps)

    # Simulate counterparty portfolio value V(t) via GBM
    V = np.full(n_paths, V0)
    cva = 0.0

    for i, t in enumerate(t_grid):
        Z = np.random.standard_normal(n_paths)
        V *= np.exp((r - 0.5*sigma_V**2)*dt + sigma_V*np.sqrt(dt)*Z)

        # Expected Exposure at time t (only positive V represents credit risk)
        EE_t  = np.mean(np.maximum(V, 0))

        # Discount factor and marginal default probability
        DF_t  = np.exp(-r * t)
        PD_t  = hazard_rate * np.exp(-hazard_rate * t) * dt  # marginal PD in [t, t+dt]

        cva  += (1 - recovery) * PD_t * EE_t * DF_t

    cva *= notional
    return cva

cva = compute_cva(
    V0=1e6,          # current MtM of derivative
    r=0.04,          # risk-free rate
    sigma_V=0.20,    # vol of portfolio value
    T=5.0,           # 5-year trade
    notional=1.0,    # already in dollars
    hazard_rate=0.02, # implied from CDS spread
    recovery=0.40
)
print(f"CVA: \${cva:,.0f}")
print(f"CVA as % of notional: {cva/1e6:.2%}")`,
    explanation: "CVA is the present value of expected credit losses on a derivative portfolio — it converts counterparty credit risk into a price adjustment; Wrong-Way Risk (WWR) arises when the exposure V(t) is positively correlated with the counterparty's default probability (e.g., selling a put on the counterparty's own stock), causing EE and PD to spike together and dramatically understating this formula's CVA estimate.",
  },
  {
    id: "pyfin-20260627-b1-mean-variance",
    language: "python",
    title: "Mean-Variance Efficient Frontier via CVXPY",
    tag: "portfolio",
    code: `import numpy as np
import cvxpy as cp

def efficient_frontier(mu, cov, n_points=50):
    """
    Compute mean-variance efficient frontier by solving:
    min  w' * Sigma * w
    s.t. w' * mu = target_return
         sum(w) = 1
         w >= 0  (long-only)
    """
    n = len(mu)
    w = cp.Variable(n)
    risk = cp.quad_form(w, cov)   # w' * Sigma * w

    target_rets = np.linspace(mu.min(), mu.max(), n_points)
    frontier_vols, frontier_rets = [], []
    frontier_weights = []

    for target in target_rets:
        constraints = [
            cp.sum(w) == 1,
            w >= 0,
            mu @ w == target
        ]
        prob = cp.Problem(cp.Minimize(risk), constraints)
        prob.solve(solver=cp.CLARABEL, verbose=False)

        if prob.status in ['optimal', 'optimal_inaccurate']:
            frontier_vols.append(np.sqrt(risk.value))
            frontier_rets.append(target)
            frontier_weights.append(w.value.copy())

    return np.array(frontier_vols), np.array(frontier_rets), frontier_weights

np.random.seed(42)
n_assets = 6
# Simulate expected returns and covariance
mu   = np.random.uniform(0.06, 0.14, n_assets)
corr = np.eye(n_assets)
for i in range(n_assets):
    for j in range(i+1, n_assets):
        rho = np.random.uniform(0.1, 0.5)
        corr[i,j] = corr[j,i] = rho
sig = np.random.uniform(0.10, 0.25, n_assets)
cov = np.diag(sig) @ corr @ np.diag(sig)

vols, rets, weights = efficient_frontier(mu, cov)
sharpes = rets / vols  # assume rf = 0 for simplicity
max_sharpe_idx = np.argmax(sharpes)

print(f"Tangency portfolio:")
print(f"  Return: {rets[max_sharpe_idx]:.4f}")
print(f"  Vol:    {vols[max_sharpe_idx]:.4f}")
print(f"  Sharpe: {sharpes[max_sharpe_idx]:.4f}")
print(f"  Weights: {weights[max_sharpe_idx].round(3)}")`,
    explanation: "CVXPY makes the efficient frontier computation a direct convex optimization with readable constraints; the key insight from Markowitz is that diversification reduces portfolio variance below the weighted average of individual variances when correlations are below 1 — the frontier illustrates exactly how much risk reduction is achievable for any given return target.",
  },
  {
    id: "pyfin-20260627-b1-brw-var",
    language: "python",
    title: "Historical VaR with BRW Age-Weighting",
    tag: "risk",
    code: `import numpy as np
import pandas as pd

def historical_var_brw(returns, confidence=0.99, decay=0.99, n_days=500):
    """
    Boudoukh-Richardson-Whitelaw (1998) age-weighted historical VaR.
    Recent observations get higher weight: w_t = (1-lambda) * lambda^(T-t-1)
    Normalizes to sum to 1 over the window.
    """
    n = min(len(returns), n_days)
    r = returns[-n:]  # most recent n days

    # Age weights: most recent day has highest weight
    ages    = np.arange(n - 1, -1, -1)   # 0 = most recent
    weights = (1 - decay) * decay**ages
    weights /= weights.sum()              # normalize (BRW uses truncated series)

    # Sort (return, weight) pairs by return (ascending = worst first)
    sorted_idx  = np.argsort(r)
    r_sorted    = r[sorted_idx]
    w_sorted    = weights[sorted_idx]

    # Find VaR: smallest loss threshold where cumulative weight >= 1 - conf
    cum_weight  = np.cumsum(w_sorted)
    breach_idx  = np.searchsorted(cum_weight, 1 - confidence)
    var         = -r_sorted[min(breach_idx, n-1)]  # positive = loss

    # Expected Shortfall: weighted average of tail losses
    tail_mask   = cum_weight <= (1 - confidence)
    if tail_mask.any():
        es_return = np.sum(r_sorted[tail_mask] * w_sorted[tail_mask]) / \
                    w_sorted[tail_mask].sum()
        es = -es_return
    else:
        es = var

    return var, es, weights

np.random.seed(42)
returns = np.random.normal(0.0003, 0.012, 2000)
# Add a cluster of bad returns 100 days ago to show age-weighting
returns[-100:-90] -= 0.04

var_brw, es_brw, _ = historical_var_brw(returns, decay=0.99)
var_eq,  es_eq,  _ = historical_var_brw(returns, decay=1.0)  # equal weights

print(f"BRW VaR (99%):        {var_brw:.4f} ({var_brw*100:.2f}%)")
print(f"Equal-weight VaR (99%): {var_eq:.4f} ({var_eq*100:.2f}%)")
print(f"BRW ES (99%):         {es_brw:.4f}")
print("BRW downweights old stress: more forward-looking than standard HistSim")`,
    explanation: "BRW's age-weighting with decay lambda=0.99 gives a 100-day-old observation roughly exp(-100*0.01) = 0.37x the weight of today's observation, making the VaR estimate adaptively lower after calm periods and higher during stress without requiring a parametric distribution — it's the middle ground between equal-weight HistSim and parametric VaR.",
  },
  {
    id: "pyfin-20260627-b1-barra-factor",
    language: "python",
    title: "Barra-Style Factor Risk Decomposition",
    tag: "factor models",
    code: `import numpy as np
import pandas as pd

def barra_risk_decompose(weights, factor_exposures, factor_cov, idio_vols):
    """
    Total portfolio variance = w' * (B * F * B' + D) * w
    B: (n_assets x n_factors) factor exposure matrix
    F: (n_factors x n_factors) factor return covariance
    D: diagonal idiosyncratic variance matrix
    """
    # Factor contribution to variance
    factor_var  = weights @ factor_exposures @ factor_cov @ factor_exposures.T @ weights

    # Idiosyncratic contribution
    D           = np.diag(idio_vols**2)
    idio_var    = weights @ D @ weights

    total_var   = factor_var + idio_var
    total_vol   = np.sqrt(total_var) * np.sqrt(252)  # annualized

    # Factor marginal contribution to risk (MCTR)
    fac_port_exp = factor_exposures.T @ weights       # portfolio factor exposures
    factor_mctr  = factor_cov @ fac_port_exp / np.sqrt(factor_var)  # marginal
    factor_ctr   = fac_port_exp * factor_mctr          # contribution to factor vol

    return {
        'total_vol':     total_vol,
        'factor_vol':    np.sqrt(factor_var) * np.sqrt(252),
        'idio_vol':      np.sqrt(idio_var)   * np.sqrt(252),
        'factor_pct':    factor_var / total_var,
        'factor_ctr':    factor_ctr * np.sqrt(252),
    }

np.random.seed(42)
n_assets, n_factors = 20, 5
w = np.random.dirichlet(np.ones(n_assets))   # random portfolio weights

# Factor exposures: beta to Mkt, Size, Value, Momentum, Quality
B = np.random.normal(0, 0.5, (n_assets, n_factors))
B[:, 0] = np.random.uniform(0.7, 1.3, n_assets)   # market beta near 1

# Factor covariance (annualized)
factor_vol  = np.array([0.15, 0.08, 0.07, 0.10, 0.06])
factor_corr = np.eye(n_factors) + 0.1*(np.ones((n_factors,n_factors))-np.eye(n_factors))
F = np.diag(factor_vol/np.sqrt(252)) @ factor_corr @ np.diag(factor_vol/np.sqrt(252))

idio_vols = np.random.uniform(0.05, 0.20, n_assets) / np.sqrt(252)

result = barra_risk_decompose(w, B, F, idio_vols)
print(f"Portfolio annualized vol:  {result['total_vol']:.4f}")
print(f"  Factor component:        {result['factor_vol']:.4f} ({result['factor_pct']:.1%})")
print(f"  Idiosyncratic component: {result['idio_vol']:.4f} ({1-result['factor_pct']:.1%})")
factors = ['Mkt', 'Size', 'Value', 'Mom', 'Quality']
print("Factor risk contributions:")
for f, ctr in zip(factors, result['factor_ctr']):
    print(f"  {f}: {ctr:.4f}")`,
    explanation: "The Barra risk decomposition separates systematic risk (driven by factor betas) from idiosyncratic risk (stock-specific), which is critical for active managers: idiosyncratic risk can be diversified away with more holdings, while systematic factor risk cannot — the MCTR (Marginal Contribution to Risk) shows exactly which factors are the largest risk consumers, guiding hedging decisions.",
  },
];
