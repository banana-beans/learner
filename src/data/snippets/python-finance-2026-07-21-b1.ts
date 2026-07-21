import { Snippet } from "./types";

export const pythonFinanceSnippets20260721B1: Snippet[] = [
  {
    id: "pyfin-20260721-b1-nelson-siegel",
    language: "python",
    title: "Nelson-Siegel-Svensson Term Structure Fitting",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def nss_yield(tau, beta0, beta1, beta2, beta3, lambda1, lambda2):
    """Nelson-Siegel-Svensson yield for maturity tau."""
    e1 = np.exp(-tau / lambda1)
    e2 = np.exp(-tau / lambda2)
    f1 = (1 - e1) / (tau / lambda1)
    f2 = (1 - e2) / (tau / lambda2)
    return beta0 + beta1 * f1 + beta2 * (f1 - e1) + beta3 * (f2 - e2)

def fit_nss(maturities, yields):
    """Calibrate NSS parameters to observed zero rates."""
    def objective(params):
        fitted = nss_yield(np.array(maturities), *params)
        return np.sum((fitted - np.array(yields))**2)

    # Initial guess: flat curve at long-end level
    x0 = [yields[-1], yields[0]-yields[-1], 0.1, 0.1, 2.0, 5.0]
    bounds = [(-0.5,0.5),(-0.5,0.5),(-0.5,0.5),(-0.5,0.5),(0.1,30),(0.1,30)]
    res = minimize(objective, x0, method='L-BFGS-B', bounds=bounds)
    b0, b1, b2, b3, l1, l2 = res.x
    print(f"beta0=\${b0:.4f}  beta1=\${b1:.4f}  beta2=\${b2:.4f}  beta3=\${b3:.4f}")
    print(f"lambda1=\${l1:.2f}  lambda2=\${l2:.2f}")
    return res.x

mats   = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30])
yields = np.array([0.050, 0.051, 0.050, 0.047, 0.046, 0.045, 0.046, 0.048, 0.050, 0.049])
params = fit_nss(mats, yields)`,
    explanation: "The Nelson-Siegel-Svensson model decomposes the yield curve into four factors: level (β₀), slope (β₁), curvature (β₂), and second hump (β₃). It is the standard model for central bank yield curve reporting (ECB, Federal Reserve) because it produces smooth, arbitrage-free extrapolation beyond observed maturities.",
  },
  {
    id: "pyfin-20260721-b1-efficient-frontier",
    language: "python",
    title: "Markowitz Efficient Frontier via scipy.optimize",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def efficient_frontier(mu: np.ndarray, Sigma: np.ndarray,
                        n_points: int = 50) -> dict:
    """
    Compute the mean-variance efficient frontier.
    mu:    expected returns (N,)
    Sigma: covariance matrix (N, N)
    """
    N = len(mu)
    results = {'returns': [], 'vols': [], 'weights': []}

    for target_ret in np.linspace(mu.min(), mu.max(), n_points):
        constraints = [
            {'type': 'eq', 'fun': lambda w: w @ mu - target_ret},
            {'type': 'eq', 'fun': lambda w: w.sum() - 1.0},
        ]
        bounds = [(0, 1)] * N   # long-only
        res = minimize(lambda w: w @ Sigma @ w,
                       np.ones(N)/N,
                       method='SLSQP',
                       bounds=bounds,
                       constraints=constraints)
        if res.success:
            w = res.x
            results['returns'].append(w @ mu)
            results['vols'].append(np.sqrt(w @ Sigma @ w))
            results['weights'].append(w)

    sharpe = np.array(results['returns']) / np.array(results['vols'])
    best   = int(np.argmax(sharpe))
    print(f"Max Sharpe: ret=\${results['returns'][best]:.3%}  "
          f"vol=\${results['vols'][best]:.3%}  SR=\${sharpe[best]:.2f}")
    return results

rng   = np.random.default_rng(0)
N     = 5
mu    = rng.uniform(0.05, 0.15, N)
A     = rng.standard_normal((N, N))
Sigma = A.T @ A / N + np.eye(N) * 0.01
efficient_frontier(mu, Sigma)`,
    explanation: "Markowitz optimization finds the minimum-variance portfolio for each target return level. SLSQP handles the equality constraint (target return + full investment) and inequality constraints (no shorting). The maximum-Sharpe tangency portfolio sits at the curve's upper-left inflection — the point practitioners call the 'efficient portfolio'.",
  },
  {
    id: "pyfin-20260721-b1-kalman-pairs",
    language: "python",
    title: "Kalman Filter for Dynamic Hedge Ratio in Pairs Trading",
    tag: "finance",
    code: `import numpy as np

def kalman_pairs(price_a: np.ndarray, price_b: np.ndarray,
                  delta: float = 1e-5) -> dict:
    """
    Track time-varying hedge ratio beta via Kalman filter.
    Model: price_a = beta * price_b + alpha + eps
    State: [beta, alpha]
    delta: process noise (higher = faster adaptation)
    """
    n     = len(price_a)
    Vw    = delta / (1 - delta) * np.eye(2)  # process noise covariance
    Ve    = 1.0                               # observation noise variance
    theta = np.zeros(2)                       # state: [beta, alpha]
    P     = np.zeros((2, 2))                  # state covariance

    betas, spreads = np.zeros(n), np.zeros(n)

    for t in range(n):
        F = np.array([price_b[t], 1.0])      # observation matrix

        # Predict
        P_pred = P + Vw

        # Update (Kalman gain)
        S  = F @ P_pred @ F + Ve
        K  = P_pred @ F / S                  # Kalman gain (2,)
        y  = price_a[t] - F @ theta           # innovation
        theta = theta + K * y
        P     = (np.eye(2) - np.outer(K, F)) @ P_pred

        betas[t]   = theta[0]
        spreads[t] = price_a[t] - theta[0]*price_b[t] - theta[1]

    zscore = (spreads - spreads.mean()) / spreads.std()
    print(f"Final beta=\${theta[0]:.4f}  alpha=\${theta[1]:.4f}")
    print(f"Spread  mean=\${spreads.mean():.4f}  std=\${spreads.std():.4f}")
    return {"betas": betas, "spreads": spreads, "zscore": zscore}

rng   = np.random.default_rng(1)
B     = np.cumprod(1 + rng.normal(0, 0.01, 500))
A     = 1.3 * B + 5 + rng.normal(0, 0.5, 500)
kalman_pairs(A, B)`,
    explanation: "The Kalman filter tracks a drifting hedge ratio (beta) in real time — far better than rolling OLS which uses a fixed window and has boundary effects. Small delta keeps beta stable; larger delta lets it track faster regime changes. The spread (residual after Kalman hedging) is closer to stationary and produces cleaner mean-reversion signals.",
  },
  {
    id: "pyfin-20260721-b1-merton-jd",
    language: "python",
    title: "Merton Jump-Diffusion Monte Carlo",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def merton_mc(S0, K, r, sigma, T, lam, mu_j, sigma_j,
               paths=100_000, steps=252, seed=42):
    """
    Merton (1976) jump-diffusion: dS = (r-lambda*kbar)*S*dt
                                      + sigma*S*dW + J*S*dN
    lam:     Poisson jump intensity (avg jumps per year)
    mu_j:    mean log-jump size
    sigma_j: std of log-jump size
    """
    rng   = np.random.default_rng(seed)
    dt    = T / steps
    kbar  = np.exp(mu_j + 0.5*sigma_j**2) - 1   # compensator
    drift = (r - lam*kbar - 0.5*sigma**2) * dt
    vol   = sigma * np.sqrt(dt)

    S = np.full(paths, S0)
    for _ in range(steps):
        Z      = rng.standard_normal(paths)
        n_jumps = rng.poisson(lam * dt, paths)     # jump count per step
        log_J  = rng.normal(mu_j, sigma_j, paths) * n_jumps  # log-jump
        S     *= np.exp(drift + vol*Z + log_J)

    payoff = np.maximum(S - K, 0)
    price  = np.exp(-r*T) * payoff.mean()
    stderr = np.exp(-r*T) * payoff.std() / np.sqrt(paths)
    print(f"Merton call = \${price:.4f} +/- \${stderr:.5f}")
    return price

merton_mc(S0=100, K=100, r=0.05, sigma=0.15, T=1.0,
          lam=0.5, mu_j=-0.10, sigma_j=0.15)`,
    explanation: "Merton adds compound Poisson jumps to GBM to model crash risk. The compensator kbar=E[J]-1 adjusts the drift to preserve risk-neutrality. Jumps create fat tails and negative skewness, explaining why OTM put implied vols exceed GBM predictions. This model is widely used in equity and FX derivatives pricing.",
  },
  {
    id: "pyfin-20260721-b1-dupire-localvol",
    language: "python",
    title: "Dupire Local Volatility Surface from Implied Vols",
    tag: "finance",
    code: `import numpy as np
from scipy.interpolate import RectBivariateSpline
from scipy.stats import norm

def bs_implied_vol_grid(K_grid, T_grid, S, r, prices):
    """Placeholder: use a vol surface matrix directly."""
    return prices  # assume prices IS the implied vol surface

def dupire_local_vol(K_grid: np.ndarray, T_grid: np.ndarray,
                      impl_vol: np.ndarray, S: float, r: float) -> np.ndarray:
    """
    Dupire (1994) local vol: sigma_loc^2(K,T) =
       (dC/dT + r*K*dC/dK) / (0.5*K^2 * d2C/dK2)
    where C is the market call price surface.
    Numerically differentiated from the implied vol grid.
    """
    # Rebuild call price surface from implied vols
    C = np.zeros_like(impl_vol)
    for i, T in enumerate(T_grid):
        sqT = np.sqrt(T)
        for j, K in enumerate(K_grid):
            v = impl_vol[i, j]
            d1 = (np.log(S/K) + (r+0.5*v**2)*T) / (v*sqT)
            d2 = d1 - v*sqT
            C[i, j] = S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

    # Spline interpolation for smooth partial derivatives
    spline = RectBivariateSpline(T_grid, K_grid, C, kx=3, ky=3)
    T2, K2 = np.meshgrid(T_grid, K_grid, indexing='ij')
    dCdT  = spline(T_grid, K_grid, dx=1)
    dCdK  = spline(T_grid, K_grid, dy=1)
    d2CdK2= spline(T_grid, K_grid, dy=2)
    numer = dCdT + r * K2 * dCdK
    denom = 0.5 * K2**2 * d2CdK2
    sigma_loc = np.sqrt(np.maximum(numer / denom, 0))
    return sigma_loc

T_grid = np.array([0.25, 0.5, 1.0, 2.0])
K_grid = np.linspace(80, 120, 20)
iv     = np.random.default_rng(0).uniform(0.18, 0.30, (4, 20))
lv     = dupire_local_vol(K_grid, T_grid, iv, S=100, r=0.05)
print(f"Local vol range: [{lv.min():.3f}, {lv.max():.3f}]")`,
    explanation: "Dupire's formula extracts the unique local volatility function consistent with all market option prices — the most general one-factor diffusion that matches the vol smile. It requires clean second derivatives of the call price surface; spline fitting is essential to suppress numerical noise. Local vol is the backbone of exotic option pricing desks.",
  },
  {
    id: "pyfin-20260721-b1-variance-swap",
    language: "python",
    title: "Variance Swap Fair Value via Log Contract Replication",
    tag: "finance",
    code: `import numpy as np
from scipy.integrate import quad
from scipy.stats import norm

def bs_put(S, K, r, sigma, T):
    d1 = (np.log(S/K) + (r+0.5*sigma**2)*T)/(sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return K*np.exp(-r*T)*norm.cdf(-d2) - S*norm.cdf(-d1)

def bs_call(S, K, r, sigma, T):
    d1 = (np.log(S/K) + (r+0.5*sigma**2)*T)/(sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

def variance_swap_strike(S, F, r, T, vol_func, eps=1e-3):
    """
    Demeterfi-Derman-Kamal replication formula:
    K_var = 2/T * [integral of OTM calls and puts / K^2]
    vol_func(K) returns the implied vol at strike K.
    """
    disc = np.exp(-r*T)

    def put_integrand(K):
        v = vol_func(K)
        return bs_put(S, K, r, v, T) / (K**2)

    def call_integrand(K):
        v = vol_func(K)
        return bs_call(S, K, r, v, T) / (K**2)

    put_integral,  _ = quad(put_integrand,  eps, F)
    call_integral, _ = quad(call_integrand, F, 10*F)
    k_var = 2/T * (put_integral + call_integral) / disc
    k_vol = np.sqrt(k_var)
    print(f"Variance swap strike: K_var=\${k_var:.6f}  K_vol=\${k_vol:.2%}")
    return k_var

# Flat vol surface (answer should match sigma^2)
vol = 0.20
variance_swap_strike(S=100, F=105, r=0.05, T=1.0,
                      vol_func=lambda K: vol)`,
    explanation: "A variance swap pays realised variance minus the fixed strike K_var. The Demeterfi-Derman-Kamal formula replicates the log contract using a strip of OTM options, weighted by 1/K². Under a flat vol surface the fair strike equals σ², but smile and skew make K_var different from ATM implied variance — the basis is called the 'vol of vol premium'.",
  },
  {
    id: "pyfin-20260721-b1-fama-french",
    language: "python",
    title: "Fama-French 3-Factor Alpha Regression",
    tag: "finance",
    code: `import numpy as np
import statsmodels.api as sm

def fama_french_alpha(port_ret: np.ndarray,
                       mkt_rf: np.ndarray,
                       smb: np.ndarray,
                       hml: np.ndarray,
                       rf: np.ndarray) -> dict:
    """
    Regress portfolio excess returns on three Fama-French factors:
    R_p - R_f = alpha + beta_mkt*(R_m-R_f) + beta_smb*SMB + beta_hml*HML + eps
    """
    y = port_ret - rf
    X = np.column_stack([mkt_rf, smb, hml])
    X = sm.add_constant(X)
    model = sm.OLS(y, X).fit(cov_type='HC3')   # HC3: heteroskedasticity robust

    alpha     = model.params[0] * 252            # annualise
    alpha_t   = model.tvalues[0]
    alpha_p   = model.pvalues[0]
    betas     = model.params[1:]

    print(f"Alpha (pa)  = \${alpha:.2%}  t=\${alpha_t:.2f}  p=\${alpha_p:.3f}")
    print(f"beta_mkt    = \${betas[0]:.3f}")
    print(f"beta_smb    = \${betas[1]:.3f}  (small-cap tilt)")
    print(f"beta_hml    = \${betas[2]:.3f}  (value tilt)")
    print(f"Adjusted R2 = \${model.rsquared_adj:.3f}")
    return {"alpha": alpha, "betas": betas, "model": model}

rng = np.random.default_rng(42)
n   = 252
rf  = np.full(n, 0.0001)
mkt = rng.normal(0.0004, 0.01, n)
smb = rng.normal(0.0001, 0.005, n)
hml = rng.normal(0.0001, 0.005, n)
# Portfolio: slight value tilt, positive alpha
port = 0.9*mkt + 0.3*smb + 0.2*hml + rng.normal(0.0003, 0.004, n)
fama_french_alpha(port, mkt, smb, hml, rf)`,
    explanation: "The Fama-French 3-factor model extends CAPM with size (SMB: small-minus-big) and value (HML: high-minus-low book-to-market) factors. Unexplained return (alpha) after controlling for these exposures is the true active management return. HC3 standard errors are robust to heteroskedasticity common in financial returns.",
  },
  {
    id: "pyfin-20260721-b1-vasicek-bond",
    language: "python",
    title: "Vasicek Model Closed-Form Bond Pricing",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import curve_fit

def vasicek_bond(r0, kappa, theta, sigma, T):
    """
    P(0,T) = A(T) * exp(-B(T)*r0)
    Vasicek affine term structure closed form.
    """
    B = (1 - np.exp(-kappa*T)) / kappa
    A = np.exp((theta - sigma**2/(2*kappa**2))*(B - T)
               - sigma**2*B**2/(4*kappa))
    return A * np.exp(-B * r0)

def vasicek_zero_rate(r0, kappa, theta, sigma, T):
    """Zero rate R(0,T) = -log(P(0,T)) / T."""
    P = vasicek_bond(r0, kappa, theta, sigma, T)
    return -np.log(P) / T

def calibrate_vasicek(maturities, zero_rates, r0):
    """Calibrate kappa, theta, sigma from observed zero rates."""
    def model(T, kappa, theta, sigma):
        return vasicek_zero_rate(r0, kappa, theta, sigma, T)
    popt, _ = curve_fit(model, maturities, zero_rates,
                         p0=[0.5, 0.05, 0.01],
                         bounds=([0.01, 0.0, 0.0], [10.0, 0.20, 0.10]))
    kappa, theta, sigma = popt
    print(f"kappa=\${kappa:.4f}  theta=\${theta:.4f}  sigma=\${sigma:.4f}")
    return popt

# Example zero rates
T    = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10])
R    = np.array([0.048, 0.047, 0.046, 0.044, 0.043, 0.042, 0.043, 0.045])
r0   = R[0]
popt = calibrate_vasicek(T, R, r0)
print("10Y bond price:", vasicek_bond(r0, *popt, T=10))`,
    explanation: "Vasicek's model dr = κ(θ−r)dt + σdW has a mean-reverting drift and Gaussian increments. The affine term structure A(T)·exp(−B(T)·r₀) gives closed-form bond prices, allowing fast calibration via curve_fit. The Gaussian distribution allows negative rates — a known limitation addressed by the CIR and Hull-White extensions.",
  },
  {
    id: "pyfin-20260721-b1-cir-closedform",
    language: "python",
    title: "CIR Model Closed-Form Bond Price (Affine Term Structure)",
    tag: "finance",
    code: `import numpy as np

def cir_bond(r0, kappa, theta, sigma, T):
    """
    Cox-Ingersoll-Ross closed-form zero-coupon bond price.
    Ensures non-negative rates when 2*kappa*theta >= sigma^2 (Feller condition).
    """
    gamma  = np.sqrt(kappa**2 + 2*sigma**2)
    denom  = (gamma + kappa)*(np.exp(gamma*T) - 1) + 2*gamma
    B      = 2*(np.exp(gamma*T) - 1) / denom
    lnA    = (2*kappa*theta/sigma**2
              * np.log(2*gamma*np.exp((kappa+gamma)*T/2) / denom))
    return np.exp(lnA - B*r0)

def cir_zero_rate(r0, kappa, theta, sigma, T):
    return -np.log(cir_bond(r0, kappa, theta, sigma, T)) / T

# Check Feller condition
def feller_satisfied(kappa, theta, sigma):
    ok = 2*kappa*theta >= sigma**2
    print(f"Feller condition: 2*kappa*theta=\${2*kappa*theta:.4f}  "
          f"sigma^2=\${sigma**2:.4f}  satisfied=\${ok}")
    return ok

r0, kappa, theta, sigma = 0.05, 1.5, 0.05, 0.1
feller_satisfied(kappa, theta, sigma)

T = np.array([0.5, 1, 2, 3, 5, 7, 10])
for t in T:
    R = cir_zero_rate(r0, kappa, theta, sigma, t)
    P = cir_bond(r0, kappa, theta, sigma, t)
    print(f"T=\${t:.1f}  R=\${R:.4f}  P=\${P:.6f}")`,
    explanation: "CIR differs from Vasicek by having a σ√r diffusion term that prevents negative rates when the Feller condition (2κθ ≥ σ²) holds. The closed form is more complex than Vasicek's but still analytical, making CIR the preferred one-factor short-rate model for US Treasury curve calibration and mortgage prepayment models.",
  },
  {
    id: "pyfin-20260721-b1-kelly-sizing",
    language: "python",
    title: "Kelly Criterion and Fractional Kelly for Portfolio Sizing",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize_scalar

def kelly_fraction(mu: float, sigma: float, rf: float = 0.0) -> float:
    """Full Kelly fraction for a continuous lognormal return stream."""
    # Kelly: f* = (mu - rf) / sigma^2
    excess = mu - rf
    f_star  = excess / sigma**2
    return f_star

def kelly_multiasset(mu: np.ndarray, Sigma: np.ndarray,
                      rf: float = 0.0) -> np.ndarray:
    """Multi-asset Kelly: f* = Sigma^{-1} * (mu - rf)."""
    excess = mu - rf
    return np.linalg.solve(Sigma, excess)

def expected_growth(f: float, mu: float, sigma: float) -> float:
    """Expected log-growth rate: g = f*mu - 0.5*f^2*sigma^2 - rf."""
    return f * mu - 0.5 * f**2 * sigma**2

def optimal_f_grid(mu: float, sigma: float, n_points: int = 100):
    """Visualise growth vs fraction and find numerical optimum."""
    fracs   = np.linspace(0, 2, n_points)
    growths = [expected_growth(f, mu, sigma) for f in fracs]
    best_idx = int(np.argmax(growths))
    f_kelly  = kelly_fraction(mu, sigma)
    print(f"Full Kelly:   f*=\${f_kelly:.4f}")
    print(f"Half Kelly:   f =\${f_kelly/2:.4f}")
    print(f"Quarter Kelly: f=\${f_kelly/4:.4f}")
    print(f"Max growth at f=\${fracs[best_idx]:.4f}  g=\${growths[best_idx]:.6f}")
    return fracs, growths

# Example: 10% annual return, 20% vol
mu, sigma = 0.10, 0.20
fracs, growths = optimal_f_grid(mu, sigma)
print("\\nMulti-asset Kelly:")
Sigma = np.array([[0.04, 0.01], [0.01, 0.09]])
mu2   = np.array([0.10, 0.12])
print("Weights:", np.round(kelly_multiasset(mu2, Sigma), 4))`,
    explanation: "Kelly maximises the long-run geometric growth rate, not mean return. At f > 2·f*, the strategy has negative expected growth — doubling Kelly is ruinous. Practitioners use half-Kelly or quarter-Kelly to trade off growth against variance of outcomes. Multi-asset Kelly inverts the covariance matrix, giving leverage proportional to Sharpe.",
  },
  {
    id: "pyfin-20260721-b1-twap-sim",
    language: "python",
    title: "TWAP Execution Simulator with Market Impact",
    tag: "finance",
    code: `import numpy as np

def twap_simulator(total_qty: int, horizon_min: int, n_slices: int,
                    sigma_daily: float, eta: float, gamma: float,
                    S0: float = 100.0, seed: int = 42) -> dict:
    """
    TWAP execution: equal slices at regular intervals.
    eta:   temporary impact coefficient (price impact per unit traded)
    gamma: permanent impact coefficient
    sigma_daily: daily vol (annualised vol / sqrt(252))
    """
    rng     = np.random.default_rng(seed)
    dt_min  = horizon_min / n_slices
    dt_year = dt_min / (252 * 6.5 * 60)  # trading minutes per year
    qty_per_slice = total_qty / n_slices
    sigma_slice   = sigma_daily * np.sqrt(dt_min / (6.5 * 60))

    S = S0
    exec_prices   = []
    perm_cost     = 0.0

    for i in range(n_slices):
        S += rng.normal(0, sigma_slice * S)  # mid price drift
        # Temporary impact: shifts execution price
        exec_px = S + eta * qty_per_slice / S0 * S
        perm_cost += gamma * qty_per_slice / S0 * S
        S         += gamma * qty_per_slice / S0 * S  # permanent impact moves mid
        exec_prices.append(exec_px)

    vwap       = np.mean(exec_prices)
    impl_short = vwap - S0           # implementation shortfall vs arrival px
    print(f"TWAP avg px:        \${vwap:.4f}")
    print(f"Impl shortfall:     \${impl_short:.4f}  ({impl_short/S0*1e4:.1f} bps)")
    print(f"Permanent impact:   \${perm_cost:.4f}")
    return {"vwap": vwap, "impl_shortfall": impl_short, "prices": exec_prices}

twap_simulator(total_qty=50_000, horizon_min=60, n_slices=12,
               sigma_daily=0.01, eta=0.05, gamma=0.01)`,
    explanation: "TWAP splits a large order into equal time slices to minimise timing risk; it outperforms naive single-batch execution for slow-moving alphas. Temporary impact (proportional to slice size) raises execution price; permanent impact (from market informational footprint) permanently shifts the mid. The ratio of sigma to impact determines whether TWAP or VWAP is better.",
  },
  {
    id: "pyfin-20260721-b1-risk-parity",
    language: "python",
    title: "Risk Parity Portfolio (Equal Risk Contribution)",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def risk_contributions(w: np.ndarray, Sigma: np.ndarray) -> np.ndarray:
    """Marginal risk contribution of each asset: RC_i = w_i * (Sigma@w)_i / port_vol."""
    port_var = w @ Sigma @ w
    mrc      = Sigma @ w               # marginal risk contributions
    return w * mrc / np.sqrt(port_var)

def risk_parity(Sigma: np.ndarray) -> np.ndarray:
    """
    Find weights where each asset contributes equally to portfolio risk.
    Minimise sum((RC_i - RC_j)^2) subject to sum(w)=1, w>=0.
    """
    N  = len(Sigma)
    def objective(w):
        rc  = risk_contributions(w, Sigma)
        avg = rc.mean()
        return np.sum((rc - avg)**2)

    constraints = [{'type': 'eq', 'fun': lambda w: w.sum() - 1.0}]
    bounds  = [(1e-4, 1.0)] * N
    w0      = np.ones(N) / N

    res = minimize(objective, w0, method='SLSQP',
                   bounds=bounds, constraints=constraints,
                   options={'ftol': 1e-12, 'maxiter': 1000})
    w = res.x / res.x.sum()
    rc = risk_contributions(w, Sigma)
    port_vol = np.sqrt(w @ Sigma @ w)
    print(f"Portfolio vol = \${port_vol:.4f}")
    for i in range(N):
        print(f"  Asset \${i}: w=\${w[i]:.4f}  RC=\${rc[i]:.4f}  RC%=\${rc[i]/port_vol:.1%}")
    return w

rng   = np.random.default_rng(0)
N     = 4
vols  = np.array([0.10, 0.15, 0.25, 0.05])  # bonds, equity, commodities, cash
corr  = np.array([[1.0,-0.2,0.1,0.0],
                   [-0.2,1.0,0.3,0.0],
                   [0.1,0.3,1.0,0.0],
                   [0.0,0.0,0.0,1.0]])
Sigma = np.outer(vols, vols) * corr
risk_parity(Sigma)`,
    explanation: "Risk parity allocates so that each asset contributes equally to total portfolio risk (not equal capital weights). In practice, bonds get much more capital than equities because equities are 3–5× more volatile. Risk parity portfolios have lower drawdowns than 60/40 but need leverage to match returns, making them sensitive to financing costs.",
  },
  {
    id: "pyfin-20260721-b1-vol-cone",
    language: "python",
    title: "Volatility Cone — Realized Vol by Lookback Period",
    tag: "finance",
    code: `import numpy as np

def vol_cone(prices: np.ndarray,
             lookbacks: list = [5, 10, 21, 63, 126, 252],
             quantiles: list = [0.10, 0.25, 0.50, 0.75, 0.90]) -> dict:
    """
    Compute realized vol distribution for each lookback period.
    Used to assess whether current implied vol is rich or cheap vs history.
    """
    log_ret = np.diff(np.log(prices))
    cone    = {}

    for lb in lookbacks:
        if lb >= len(log_ret):
            continue
        # Rolling annualised vol for each window
        vols = []
        for i in range(lb, len(log_ret)+1):
            r_window = log_ret[i-lb:i]
            rv = r_window.std() * np.sqrt(252)
            vols.append(rv)
        vols = np.array(vols)
        cone[lb] = {
            'mean':  vols.mean(),
            'current': vols[-1],
        }
        for q in quantiles:
            cone[lb][f'p\${int(q*100)}'] = np.quantile(vols, q)

    print(f"{'LB':>4} {'p10':>6} {'p25':>6} {'p50':>6} {'p75':>6} {'p90':>6} {'curr':>6}")
    for lb, d in cone.items():
        print(f"\${lb:>4} \${d['p10']:.3f} \${d['p25']:.3f} \${d['p50']:.3f}"
              f" \${d['p75']:.3f} \${d['p90']:.3f} \${d['current']:.3f}")
    return cone

rng    = np.random.default_rng(0)
prices = np.cumprod(1 + rng.normal(0, 0.015, 1000)) * 100
vol_cone(prices)`,
    explanation: "The vol cone shows realized vol distributions for each lookback period. Current implied vol is 'rich' if it exceeds the 75th percentile of historical realized vol at the same tenor, suggesting selling vol is attractive. The cone is a standard tool for options market-makers to calibrate their bid-ask spread and gamma booking.",
  },
  {
    id: "pyfin-20260721-b1-binomial-american",
    language: "python",
    title: "Binomial Tree American Put with Early-Exercise Boundary",
    tag: "finance",
    code: `import numpy as np

def binomial_american_put(S0, K, r, sigma, T, steps=200):
    """Cox-Ross-Rubinstein binomial tree for American put."""
    dt   = T / steps
    u    = np.exp(sigma * np.sqrt(dt))
    d    = 1.0 / u
    p    = (np.exp(r*dt) - d) / (u - d)      # risk-neutral prob (up)
    disc = np.exp(-r*dt)

    # Terminal asset prices (vectorised)
    j    = np.arange(steps + 1)
    S_T  = S0 * u**(steps - j) * d**j        # S0 * u^(steps-2j) effectively
    V    = np.maximum(K - S_T, 0.0)           # terminal put payoff

    # Early-exercise boundary tracking
    exercise_boundary = {}

    # Backward induction
    for i in range(steps - 1, -1, -1):
        S_i = S0 * u**(i - np.arange(i+1)) * d**np.arange(i+1)
        hold = disc * (p * V[:i+1] + (1-p) * V[1:i+2])
        exer = np.maximum(K - S_i, 0.0)
        V    = np.maximum(hold, exer)
        # Record exercise boundary: lowest S where exercise is optimal
        early = np.where(exer > hold)[0]
        if len(early) > 0:
            exercise_boundary[i] = S_i[early[-1]]  # highest S where exercised

    price = V[0]
    print(f"American put price = \${price:.4f}")
    print(f"European put (no early ex) reference — compare with analytial BS put")
    return price, exercise_boundary

price, boundary = binomial_american_put(S0=100, K=100, r=0.05, sigma=0.2, T=1.0)`,
    explanation: "CRR backward induction checks at each node whether immediate exercise (K−S) exceeds the continuation value (discounted expected future value). The early-exercise boundary separates hold and exercise regions; deep ITM puts are exercised immediately to collect the interest on the strike K. American puts are worth more than European puts when interest rates are positive.",
  },
  {
    id: "pyfin-20260721-b1-regime-switching",
    language: "python",
    title: "Two-State Markov Regime-Switching Model (Baum-Welch EM)",
    tag: "finance",
    code: `import numpy as np

def fit_markov_switching(returns: np.ndarray, n_iter: int = 100) -> dict:
    """
    Fit 2-state Gaussian Markov switching model via EM (Baum-Welch).
    State 0: low-vol regime; State 1: high-vol (crisis) regime.
    """
    n = len(returns)
    # Initial parameters
    mu    = np.array([returns.mean(), returns.mean()*2])
    sigma = np.array([returns.std()*0.7, returns.std()*1.5])
    P     = np.array([[0.95, 0.05], [0.10, 0.90]])  # transition matrix

    def gauss(x, m, s): return np.exp(-0.5*((x-m)/s)**2) / (s*np.sqrt(2*np.pi))

    for _ in range(n_iter):
        # Forward pass: alpha[t,k] = P(obs[0..t], state_t=k)
        alpha = np.zeros((n, 2))
        alpha[0] = 0.5 * gauss(returns[0], mu, sigma)
        for t in range(1, n):
            for k in range(2):
                alpha[t,k] = gauss(returns[t], mu[k], sigma[k]) * \
                              (alpha[t-1] @ P[:, k])
            alpha[t] /= alpha[t].sum() + 1e-300

        # Backward pass: beta[t,k] = P(obs[t+1..n-1] | state_t=k)
        beta = np.ones((n, 2))
        for t in range(n-2, -1, -1):
            for k in range(2):
                beta[t,k] = sum(P[k,j]*gauss(returns[t+1],mu[j],sigma[j])*beta[t+1,j]
                                for j in range(2))
            beta[t] /= beta[t].sum() + 1e-300

        # Smoothed state probabilities
        gamma = alpha * beta
        gamma /= gamma.sum(axis=1, keepdims=True) + 1e-300

        # M-step: update parameters
        for k in range(2):
            wt       = gamma[:, k]
            mu[k]    = (wt * returns).sum() / wt.sum()
            sigma[k] = np.sqrt((wt * (returns-mu[k])**2).sum() / wt.sum())
        for i in range(2):
            for j in range(2):
                xi_num = (alpha[:-1,i]*P[i,j]*gauss(returns[1:],mu[j],sigma[j])*beta[1:,j])
                P[i,j] = xi_num.sum() / (gamma[:-1,i].sum() + 1e-300)
            P[i] /= P[i].sum()

    print(f"State 0: mu=\${mu[0]:.4f}  sigma=\${sigma[0]:.4f}  (low-vol)")
    print(f"State 1: mu=\${mu[1]:.4f}  sigma=\${sigma[1]:.4f}  (high-vol)")
    print(f"Transition P:\\n\${P}")
    return {"mu": mu, "sigma": sigma, "P": P, "smoothed_probs": gamma}

rng = np.random.default_rng(0)
r   = np.concatenate([rng.normal(0, 0.01, 200), rng.normal(-0.002, 0.025, 50),
                       rng.normal(0, 0.01, 200)])
fit_markov_switching(r)`,
    explanation: "Markov regime-switching captures the empirical bimodality of return distributions (calm vs crisis). The Baum-Welch algorithm is EM applied to hidden Markov models: the E-step computes smoothed state probabilities (forward-backward algorithm); the M-step updates Gaussian parameters and the transition matrix. Used for risk-on/risk-off signal generation and conditional VaR.",
  },
  {
    id: "pyfin-20260721-b1-fwd-rate-interp",
    language: "python",
    title: "Forward Rate Interpolation — Log-Linear Discount Factors",
    tag: "finance",
    code: `import numpy as np
from scipy.interpolate import interp1d

def build_discount_curve(maturities: np.ndarray,
                          zero_rates: np.ndarray) -> callable:
    """
    Build a discount factor interpolator using log-linear interpolation
    on discount factors (= piecewise constant forward rates).
    """
    # Compute discount factors from zero rates
    df   = np.exp(-zero_rates * maturities)
    # Prepend T=0: df(0)=1
    T    = np.concatenate([[0.0], maturities])
    D    = np.concatenate([[1.0], df])
    # Log-linear on df ≡ linear on continuous zero rates
    log_D = np.log(D)
    interp = interp1d(T, log_D, kind='linear', fill_value='extrapolate')
    def discount(t): return np.exp(interp(t))
    return discount

def forward_rate(discount_fn: callable, T1: float, T2: float) -> float:
    """Continuously compounded forward rate between T1 and T2."""
    df1, df2 = discount_fn(T1), discount_fn(T2)
    return np.log(df1/df2) / (T2 - T1)

T    = np.array([0.25, 0.5, 1.0, 2.0, 3.0, 5.0, 7.0, 10.0])
R    = np.array([0.045, 0.046, 0.047, 0.046, 0.045, 0.044, 0.045, 0.047])
df_fn = build_discount_curve(T, R)

print("Discount factors:")
for t in [0.5, 1.0, 2.0, 5.0, 10.0]:
    print(f"  T=\${t:.1f}  DF=\${df_fn(t):.6f}")

print("\\nForward rates:")
for t1, t2 in [(0, 0.5), (0.5, 1.0), (1.0, 2.0), (2.0, 5.0)]:
    f = forward_rate(df_fn, t1, t2)
    print(f"  f(\${t1:.1f},\${t2:.1f}) = \${f:.4f}")`,
    explanation: "Log-linear interpolation of discount factors implies piecewise-constant forward rates — the most natural assumption since forward rates are the primitive instruments (FRAs). It avoids the spurious forward rate oscillations of polynomial yield interpolation. Used in swap pricing, FX forward valuation, and OIS-LIBOR basis curve construction.",
  },
  {
    id: "pyfin-20260721-b1-stress-scenario",
    language: "python",
    title: "Yield Curve Stress Scenarios (Shift, Twist, Butterfly)",
    tag: "finance",
    code: `import numpy as np

def curve_scenarios(zero_rates: np.ndarray,
                     maturities: np.ndarray) -> dict:
    """
    Standard regulatory yield curve stress scenarios.
    Parallel shift, steepener, flattener, butterfly.
    """
    T  = np.array(maturities)
    R0 = np.array(zero_rates)
    n  = len(T)
    # Normalised maturity for weighting
    T_norm = (T - T.min()) / (T.max() - T.min())

    scenarios = {
        'parallel_up':   R0 + 0.01,
        'parallel_down': R0 - 0.01,
        # Steepener: short end down, long end up
        'steepener':     R0 + 0.01 * (2*T_norm - 1),
        # Flattener: short end up, long end down
        'flattener':     R0 - 0.01 * (2*T_norm - 1),
        # Butterfly: belly up, wings down
        'butterfly':     R0 + 0.005 * (1 - 4*(T_norm - 0.5)**2),
        # Inversion: yield curve inverts
        'inversion':     R0 - 0.02 * (1 - T_norm),
    }

    def bond_pv(rates, coupon=0.04, face=100, freq=2):
        """Simple fixed-rate bond PV across the stress curve."""
        pv = 0.0
        n_periods = int(T[-1] * freq)
        for i in range(1, n_periods+1):
            t_i = i / freq
            r_i = np.interp(t_i, T, rates)
            pv += coupon/freq * face * np.exp(-r_i * t_i)
        pv += face * np.exp(-rates[-1] * T[-1])
        return pv

    base_pv = bond_pv(R0)
    print(f"Base PV = \${base_pv:.2f}")
    for name, stressed_R in scenarios.items():
        pv  = bond_pv(stressed_R)
        pnl = pv - base_pv
        print(f"  \${name:<20} PV=\${pv:.2f}  DV=\${pnl:+.2f}")
    return scenarios

T = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10])
R = np.array([0.048, 0.047, 0.046, 0.044, 0.043, 0.042, 0.043, 0.045])
curve_scenarios(R, T)`,
    explanation: "Regulatory stress tests (IRRBB) require evaluating bond portfolios under six standard scenarios. The butterfly scenario stresses curvature risk independent of level and slope. Banks report DV01, CS01, and scenario PnL across these shocks to their asset-liability committees; the largest adverse PnL determines interest rate risk capital.",
  },
  {
    id: "pyfin-20260721-b1-factor-zscore",
    language: "python",
    title: "Cross-Sectional Factor Z-Score Signal",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def cross_sectional_zscore(factor_matrix: np.ndarray,
                             winsorize_pct: float = 0.05) -> np.ndarray:
    """
    Compute cross-sectional z-scores with winsorization and MAD normalisation.
    factor_matrix: (T, N) — T dates, N stocks
    Returns z-score matrix ready for signal weighting.
    """
    T, N = factor_matrix.shape
    z = np.zeros_like(factor_matrix)

    for t in range(T):
        f = factor_matrix[t].copy()
        # Winsorize: clip extreme values at percentile bounds
        lo = np.nanpercentile(f, winsorize_pct * 100)
        hi = np.nanpercentile(f, (1 - winsorize_pct) * 100)
        f  = np.clip(f, lo, hi)
        # MAD normalisation (robust to outliers)
        med  = np.nanmedian(f)
        mad  = np.nanmedian(np.abs(f - med)) * 1.4826  # scale to match std
        z[t] = (f - med) / (mad + 1e-10)

    return z

def factor_portfolio(z_scores: np.ndarray, returns: np.ndarray,
                      top_pct: float = 0.2) -> dict:
    """Long top decile, short bottom decile, dollar-neutral."""
    T, N    = z_scores.shape
    port_ret = np.zeros(T-1)

    for t in range(T-1):
        z = z_scores[t]
        n_leg = max(1, int(N * top_pct))
        long_idx  = np.argsort(z)[-n_leg:]
        short_idx = np.argsort(z)[:n_leg]
        long_w    = np.zeros(N); long_w[long_idx]   = 1/n_leg
        short_w   = np.zeros(N); short_w[short_idx] = 1/n_leg
        port_ret[t] = (long_w - short_w) @ returns[t]

    sharpe = port_ret.mean() / (port_ret.std() + 1e-10) * np.sqrt(252)
    print(f"Factor IC-weighted portfolio: Sharpe=\${sharpe:.2f}  "
          f"mean daily ret=\${port_ret.mean():.4%}")
    return {"returns": port_ret, "sharpe": sharpe}

rng  = np.random.default_rng(0)
T, N = 252, 100
# Momentum factor: past 20-day return
factors = rng.standard_normal((T, N))
returns = 0.05*factors + rng.normal(0, 0.02, (T, N))
z = cross_sectional_zscore(factors)
factor_portfolio(z, returns)`,
    explanation: "Cross-sectional z-scoring makes factor signals comparable across stocks and dates. MAD (median absolute deviation) normalisation is more robust to outliers than standard deviation. Winsorization before z-scoring prevents single-stock extreme values from driving the entire cross-section — critical for penny stocks or earnings surprise outliers.",
  },
  {
    id: "pyfin-20260721-b1-carry-rolldown",
    language: "python",
    title: "Fixed Income Carry and Roll-Down Attribution",
    tag: "finance",
    code: `import numpy as np

def carry_rolldown(ytm_today: float, ytm_forward: float,
                    duration: float, convexity: float,
                    horizon_years: float, coupon_rate: float) -> dict:
    """
    Decompose total return into:
      1. Carry (coupon income + pull-to-par)
      2. Roll-down (price change from riding the curve)
      3. Rate change (duration + convexity effect)
    ytm_today:   current yield to maturity
    ytm_forward: yield expected in horizon years (constant curve → ytm_forward = ytm at shorter maturity)
    """
    # Carry: coupon accrual over horizon
    carry   = coupon_rate * horizon_years

    # Roll-down: price change as bond rolls to shorter maturity
    # Assuming spot curve is unchanged: yield drops from ytm_today to ytm_forward
    dy_roll  = ytm_forward - ytm_today    # yield change due to roll
    rolldown = -duration * dy_roll + 0.5 * convexity * dy_roll**2

    # Rate change P&L for a 25bps parallel shift
    dy_shock    = 0.0025
    rate_change = -duration * dy_shock + 0.5 * convexity * dy_shock**2

    total_return = carry + rolldown
    print(f"Carry:           \${carry*100:.2f} bps")
    print(f"Roll-down:       \${rolldown*100:.2f} bps")
    print(f"Total (no shock):\${total_return*100:.2f} bps  over \${horizon_years*12:.0f} months")
    print(f"DV01 (25bp up):  \${rate_change*100:.2f} bps per bond")
    return {"carry": carry, "rolldown": rolldown, "total": total_return,
            "break_even_shift": carry / duration}

# 5Y Treasury, 4% coupon, duration 4.5yr, holding for 3 months
result = carry_rolldown(ytm_today=0.045, ytm_forward=0.043,
                         duration=4.5, convexity=0.22,
                         horizon_years=0.25, coupon_rate=0.04)
print(f"Break-even parallel shift: \${result['break_even_shift']*1e4:.1f} bps")`,
    explanation: "Carry-roll-down is the dominant source of bond P&L in normal environments. Roll-down gains occur when the yield curve is upward-sloping: a 5Y bond 'rolls down' to become a 4.75Y bond, priced at the lower 4.75Y yield. The break-even rate shift tells you how much rates must rise before the carry and roll-down are wiped out.",
  },
  {
    id: "pyfin-20260721-b1-constrained-mv",
    language: "python",
    title: "Mean-Variance with Sector and Turnover Constraints",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def constrained_portfolio(mu: np.ndarray, Sigma: np.ndarray,
                           w0: np.ndarray, sectors: list,
                           sector_max: float = 0.35,
                           turnover_max: float = 0.20,
                           lam: float = 10.0) -> np.ndarray:
    """
    Constrained mean-variance optimisation:
    max  mu'w - (lam/2)*w'Sigma*w
    s.t. sum(w)=1, w>=0, sector sums <= sector_max,
         sum|w-w0| <= turnover_max
    """
    N = len(mu)
    unique_sectors = list(set(sectors))

    def neg_utility(w):
        return -(mu @ w - (lam/2) * w @ Sigma @ w)

    constraints = [
        {'type': 'eq', 'fun': lambda w: w.sum() - 1.0},
        # Turnover: linearised via auxiliary variables not needed for small N
        {'type': 'ineq', 'fun': lambda w: turnover_max - np.abs(w - w0).sum()},
    ]
    for sec in unique_sectors:
        idx = [i for i, s in enumerate(sectors) if s == sec]
        constraints.append({
            'type': 'ineq',
            'fun': lambda w, idx=idx: sector_max - sum(w[i] for i in idx)
        })

    bounds = [(0, 1)] * N
    res = minimize(neg_utility, w0, method='SLSQP',
                   bounds=bounds, constraints=constraints,
                   options={'ftol': 1e-10})
    w = res.x
    turnover = np.abs(w - w0).sum()
    print(f"Expected return: \${mu@w:.4f}  Vol: \${np.sqrt(w@Sigma@w):.4f}")
    print(f"Turnover: \${turnover:.4f}  (max \${turnover_max:.2f})")
    for sec in unique_sectors:
        idx = [i for i, s in enumerate(sectors) if s == sec]
        print(f"  Sector \${sec}: \${sum(w[idx]):.4f}")
    return w

rng    = np.random.default_rng(0)
N      = 10
mu     = rng.uniform(0.05, 0.15, N)
A      = rng.standard_normal((N, N)); Sigma = A.T@A/N + np.eye(N)*0.01
w0     = np.ones(N)/N
sectors = ['Tech']*4 + ['Finance']*3 + ['Energy']*3
constrained_portfolio(mu, Sigma, w0, sectors)`,
    explanation: "Practical portfolio construction adds sector concentration limits (prevent 40% in tech) and turnover constraints (limit transaction costs from rebalancing). SLSQP handles these as linear/nonlinear inequality constraints. The turnover constraint is non-differentiable at w=w0 so the absolute value needs careful handling; for production, use a true L1 QP formulation.",
  },
];
