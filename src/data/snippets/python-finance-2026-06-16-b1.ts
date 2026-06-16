import { Snippet } from "./types";

export const pythonFinanceSnippets20260616B1: Snippet[] = [
  {
    id: "pyfin-20260616-b1-sabr",
    language: "python",
    title: "SABR stochastic vol – Hagan implied vol formula",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import brentq

def sabr_vol(F: float, K: float, T: float,
             alpha: float, beta: float, rho: float, nu: float) -> float:
    """Hagan et al. 2002 approximation for SABR implied vol."""
    if abs(F - K) < 1e-10:
        # ATM formula
        term1 = alpha / (F ** (1 - beta))
        term2 = 1 + ((1 - beta)**2 / 24 * alpha**2 / F**(2*(1-beta))
                     + rho*beta*nu*alpha / (4 * F**(1-beta))
                     + (2 - 3*rho**2) / 24 * nu**2) * T
        return term1 * term2

    log_FK = np.log(F / K)
    FK_mid = (F * K) ** ((1 - beta) / 2)
    z = nu / alpha * FK_mid * log_FK
    x_z = np.log((np.sqrt(1 - 2*rho*z + z**2) + z - rho) / (1 - rho))

    A = alpha / (FK_mid * (1 + (1-beta)**2/24 * log_FK**2
                           + (1-beta)**4/1920 * log_FK**4))
    B = z / x_z
    C = 1 + ((1-beta)**2/24 * alpha**2 / FK_mid**2
             + rho*beta*nu*alpha / (4 * FK_mid)
             + (2 - 3*rho**2)/24 * nu**2) * T
    return A * B * C

def calibrate_sabr(F: float, T: float,
                   strikes: list[float], market_vols: list[float],
                   beta: float = 0.5) -> tuple[float, float, float]:
    """Calibrate alpha, rho, nu by least-squares."""
    from scipy.optimize import least_squares
    def residuals(x):
        alpha, rho, nu = x
        if alpha <= 0 or nu <= 0 or abs(rho) >= 1:
            return [1e6] * len(strikes)
        return [sabr_vol(F, K, T, alpha, beta, rho, nu) - mv
                for K, mv in zip(strikes, market_vols)]
    res = least_squares(residuals, x0=[0.2, -0.3, 0.4],
                        bounds=([1e-4, -0.999, 1e-4], [5.0, 0.999, 5.0]))
    return tuple(res.x)

# Demo
if __name__ == "__main__":
    F, T = 100.0, 1.0
    strikes = [80, 90, 95, 100, 105, 110, 120]
    # Synthetic market vols
    alpha, beta, rho, nu = 0.3, 0.5, -0.25, 0.4
    mkt_vols = [sabr_vol(F, K, T, alpha, beta, rho, nu) for K in strikes]
    a_fit, r_fit, n_fit = calibrate_sabr(F, T, strikes, mkt_vols, beta)
    print(f"Calibrated: alpha={a_fit:.4f}, rho={r_fit:.4f}, nu={n_fit:.4f}")`,
    explanation: "SABR (Stochastic Alpha Beta Rho) model gives a closed-form approximation for implied vol as a function of strike and expiry. Beta fixes the vol backbone (0=normal, 1=log-normal). Used heavily for swaption vol surfaces and FX options.",
  },
  {
    id: "pyfin-20260616-b1-vasicek-bond",
    language: "python",
    title: "Vasicek bond pricing and yield curve calibration",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def vasicek_zcb(r0: float, kappa: float, theta: float,
                sigma: float, T: float) -> float:
    """Zero-coupon bond price P(0,T) under Vasicek model."""
    B = (1 - np.exp(-kappa * T)) / kappa
    A = np.exp(
        (theta - sigma**2 / (2 * kappa**2)) * (B - T)
        - sigma**2 * B**2 / (4 * kappa)
    )
    return A * np.exp(-B * r0)

def vasicek_yield(r0: float, kappa: float, theta: float,
                  sigma: float, T: float) -> float:
    P = vasicek_zcb(r0, kappa, theta, sigma, T)
    return -np.log(P) / T

def calibrate_vasicek(r0: float, maturities: list[float],
                      market_yields: list[float]) -> tuple:
    """Fit kappa, theta, sigma to observed yield curve."""
    def obj(x):
        kappa, theta, sigma = x
        if kappa <= 0 or sigma <= 0:
            return 1e9
        model_yields = [vasicek_yield(r0, kappa, theta, sigma, T)
                        for T in maturities]
        return sum((m - y)**2 for m, y in zip(model_yields, market_yields))
    res = minimize(obj, x0=[0.5, 0.04, 0.01],
                   method="Nelder-Mead",
                   options={"xatol": 1e-8, "fatol": 1e-10})
    return tuple(res.x)

# Demo
maturities = [0.25, 0.5, 1, 2, 3, 5, 7, 10]
r0 = 0.03
kappa_true, theta_true, sigma_true = 0.8, 0.05, 0.015
mkt_yields = [vasicek_yield(r0, kappa_true, theta_true, sigma_true, T)
              for T in maturities]
k, th, sig = calibrate_vasicek(r0, maturities, mkt_yields)
print(f"kappa={k:.4f}, theta={th:.4f}, sigma={sig:.4f}")
print(f"10Y model yield: {vasicek_yield(r0, k, th, sig, 10)*100:.2f}%")`,
    explanation: "Vasicek (1977) one-factor Gaussian interest rate model. The affine structure gives exact ZCB price in closed form via A(T) and B(T) functions. Calibrate kappa (mean-reversion speed), theta (long-run mean), sigma (vol) by minimizing yield errors.",
  },
  {
    id: "pyfin-20260616-b1-nelson-siegel",
    language: "python",
    title: "Nelson-Siegel yield curve fitting",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def ns_yield(tau: float, beta0: float, beta1: float,
             beta2: float, lam: float) -> float:
    """Nelson-Siegel parametric yield for maturity tau."""
    x = lam * tau
    load1 = (1 - np.exp(-x)) / x
    load2 = load1 - np.exp(-x)
    return beta0 + beta1 * load1 + beta2 * load2

def ns_yields(taus: np.ndarray, params: np.ndarray) -> np.ndarray:
    beta0, beta1, beta2, lam = params
    x = lam * taus
    load1 = (1 - np.exp(-x)) / x
    load2 = load1 - np.exp(-x)
    return beta0 + beta1 * load1 + beta2 * load2

def fit_ns(maturities: np.ndarray, yields: np.ndarray) -> np.ndarray:
    """Fit Nelson-Siegel to observed yield data."""
    def obj(p):
        if p[3] <= 0:
            return 1e9
        return np.sum((ns_yields(maturities, p) - yields)**2)
    res = minimize(obj, x0=[0.05, -0.02, 0.01, 1.5],
                   method="Nelder-Mead")
    return res.x

def interpret_ns(params: np.ndarray):
    b0, b1, b2, lam = params
    print(f"Level (beta0)     = {b0*100:.2f}%  (long-run yield)")
    print(f"Slope (beta1)     = {b1*100:.2f}%  (short - long spread)")
    print(f"Curvature (beta2) = {b2*100:.2f}%  (mid-maturity hump)")
    print(f"Lambda            = {lam:.4f}   (peak at {1/lam:.2f}y)")

# Demo
maturities = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30])
# Typical upward-sloping curve
yields = np.array([0.030, 0.032, 0.035, 0.038, 0.040,
                   0.043, 0.045, 0.046, 0.048, 0.049])
params = fit_ns(maturities, yields)
interpret_ns(params)
fitted = ns_yields(maturities, params)
rmse = np.sqrt(np.mean((fitted - yields)**2))
print(f"RMSE: {rmse*10000:.2f} bps")`,
    explanation: "Nelson-Siegel (1987) decomposes the yield curve into level (beta0), slope (beta1), and curvature (beta2) factors with exponential loading functions. Lambda controls where the hump peaks. Used by central banks for yield curve modeling.",
  },
  {
    id: "pyfin-20260616-b1-cvar-es",
    language: "python",
    title: "CVaR / Expected Shortfall – parametric and historical",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm, t as student_t

def var_normal(returns: np.ndarray, alpha: float = 0.99) -> float:
    mu, sigma = returns.mean(), returns.std(ddof=1)
    return -(mu + sigma * norm.ppf(1 - alpha))

def cvar_normal(returns: np.ndarray, alpha: float = 0.99) -> float:
    """Expected Shortfall under Gaussian assumption."""
    mu, sigma = returns.mean(), returns.std(ddof=1)
    z = norm.ppf(alpha)
    return -(mu - sigma * norm.pdf(z) / (1 - alpha))

def var_t(returns: np.ndarray, alpha: float = 0.99) -> float:
    mu, sigma = returns.mean(), returns.std(ddof=1)
    nu = 6  # fat-tail degrees of freedom
    return -(mu + sigma * student_t.ppf(1 - alpha, df=nu))

def cvar_t(returns: np.ndarray, alpha: float = 0.99, nu: int = 6) -> float:
    """ES under Student-t distribution."""
    mu, sigma = returns.mean(), returns.std(ddof=1)
    q = student_t.ppf(alpha, df=nu)
    # Analytical ES for Student-t
    es_std = (student_t.pdf(q, df=nu) / (1 - alpha)
              * (nu + q**2) / (nu - 1))
    return -(mu - sigma * es_std)

def historical_cvar(returns: np.ndarray, alpha: float = 0.99) -> tuple:
    """Non-parametric VaR and ES from sorted losses."""
    losses = -returns
    losses_sorted = np.sort(losses)[::-1]
    n = len(losses_sorted)
    cutoff = int(np.ceil((1 - alpha) * n))
    var = losses_sorted[cutoff - 1]
    es = losses_sorted[:cutoff].mean()
    return var, es

# Demo
rng = np.random.default_rng(42)
# Fat-tailed returns
returns = rng.standard_t(df=5, size=5000) * 0.01 - 0.0002

print("Parametric (Normal):")
print(f"  VaR  99%: {var_normal(returns)*100:.3f}%")
print(f"  CVaR 99%: {cvar_normal(returns)*100:.3f}%")
print("Parametric (t, nu=6):")
print(f"  CVaR 99%: {cvar_t(returns)*100:.3f}%")
print("Historical:")
v, es = historical_cvar(returns)
print(f"  VaR  99%: {v*100:.3f}%")
print(f"  ES   99%: {es*100:.3f}%")`,
    explanation: "CVaR (= Expected Shortfall = ES) is the mean loss in the worst (1-alpha)% of scenarios. Parametric formulas are fast but assume a distribution; historical simulation is non-parametric. ES is subadditive (unlike VaR) and preferred under Basel III.",
  },
  {
    id: "pyfin-20260616-b1-merton-jump",
    language: "python",
    title: "Merton jump-diffusion Monte Carlo option pricing",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def bs_call(S, K, r, T, sigma):
    if T <= 0:
        return max(S - K, 0.0)
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

def merton_jump_mc(S0: float, K: float, r: float, T: float,
                   sigma: float, lam: float, mu_j: float, sig_j: float,
                   n_paths: int = 200_000, n_steps: int = 252) -> float:
    """
    Merton (1976) jump-diffusion: dS = (r - lam*kappa)*S dt
        + sigma*S dW + J*S dN, J ~ LN(mu_j, sig_j^2)
    """
    dt = T / n_steps
    kappa = np.exp(mu_j + 0.5 * sig_j**2) - 1  # mean jump size

    rng = np.random.default_rng(42)
    log_S = np.zeros(n_paths)

    # Drift correction for jump compensator
    drift = (r - 0.5*sigma**2 - lam*kappa) * dt

    for _ in range(n_steps):
        # Diffusion
        dW = rng.standard_normal(n_paths) * np.sqrt(dt)
        log_S += drift + sigma * dW
        # Jumps: Poisson arrivals
        n_jumps = rng.poisson(lam * dt, size=n_paths)
        # Compound jump: sum of n_jumps log-normal jumps
        jump_sizes = rng.normal(mu_j, sig_j, size=(n_steps, n_paths))
        # Vectorised: mask where jumps occur
        log_S += np.array([
            jump_sizes[:, i][:n_jumps[i]].sum() if n_jumps[i] else 0.0
            for i in range(n_paths)
        ])

    payoffs = np.maximum(S0 * np.exp(log_S) - K, 0.0)
    return np.exp(-r * T) * payoffs.mean()

# Faster vectorised single-step approximation
def merton_series(S0, K, r, T, sigma, lam, mu_j, sig_j, n_terms=20):
    """Merton closed-form series expansion."""
    kappa = np.exp(mu_j + 0.5*sig_j**2) - 1
    lam_prime = lam * (1 + kappa)
    price = 0.0
    for n in range(n_terms):
        r_n = r - lam*kappa + n*(mu_j + 0.5*sig_j**2)/T
        sig_n = np.sqrt(sigma**2 + n*sig_j**2/T)
        w = np.exp(-lam_prime*T) * (lam_prime*T)**n / np.math.factorial(n)
        price += w * bs_call(S0, K, r_n, T, sig_n)
    return price

S0, K, r, T = 100, 105, 0.05, 0.5
sigma, lam, mu_j, sig_j = 0.15, 1.0, -0.05, 0.10
series_price = merton_series(S0, K, r, T, sigma, lam, mu_j, sig_j)
print(f"Merton series price: {series_price:.4f}")`,
    explanation: "Merton (1976) adds Poisson jumps to GBM, producing fat tails and volatility smiles. The series expansion sums over number of jumps, applying Black-Scholes for each term. Lambda is jump intensity, mu_j / sig_j are log-jump mean/vol.",
  },
  {
    id: "pyfin-20260616-b1-importance-sampling",
    language: "python",
    title: "Importance sampling for deep OTM options",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def bs_call(S0, K, r, T, sigma):
    d1 = (np.log(S0/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return S0*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

def mc_naive(S0, K, r, T, sigma, n=500_000, seed=42):
    rng = np.random.default_rng(seed)
    Z = rng.standard_normal(n)
    ST = S0 * np.exp((r - 0.5*sigma**2)*T + sigma*np.sqrt(T)*Z)
    payoff = np.maximum(ST - K, 0.0)
    price = np.exp(-r*T) * payoff.mean()
    se = np.exp(-r*T) * payoff.std() / np.sqrt(n)
    return price, se

def mc_importance_sampling(S0, K, r, T, sigma, n=50_000, seed=42):
    """
    Shift the sampling distribution so more paths reach the OTM strike.
    Optimal drift: mu* = log(K/S0) / (sigma*sqrt(T)) — put mass near K.
    """
    rng = np.random.default_rng(seed)
    # Optimal mean shift
    mu_star = (np.log(K/S0) - (r - 0.5*sigma**2)*T) / (sigma*np.sqrt(T))

    Z = rng.standard_normal(n) + mu_star
    ST = S0 * np.exp((r - 0.5*sigma**2)*T + sigma*np.sqrt(T)*Z)

    # Likelihood ratio (Radon-Nikodym derivative)
    lr = np.exp(-mu_star * (Z - mu_star) - 0.5 * mu_star**2)

    payoff = np.maximum(ST - K, 0.0) * lr
    price = np.exp(-r*T) * payoff.mean()
    se = np.exp(-r*T) * payoff.std() / np.sqrt(n)
    return price, se

S0, K, r, T, sigma = 100, 150, 0.05, 1.0, 0.2  # deep OTM
exact = bs_call(S0, K, r, T, sigma)
naive_p, naive_se = mc_naive(S0, K, r, T, sigma, n=500_000)
is_p, is_se = mc_importance_sampling(S0, K, r, T, sigma, n=50_000)

print(f"Exact BS:            {exact:.6f}")
print(f"Naive MC (500k):     {naive_p:.6f}  SE={naive_se:.6f}")
print(f"IS MC    (50k):      {is_p:.6f}  SE={is_se:.6f}")
print(f"Variance reduction:  {(naive_se/is_se)**2 * (500_000/50_000):.1f}x")`,
    explanation: "For deep OTM options, naive MC wastes paths. Importance sampling shifts the sampling measure so paths concentrate near the strike, then corrects with a likelihood ratio. Variance reduction of 10-100x is common for 5-10 delta options.",
  },
  {
    id: "pyfin-20260616-b1-black76",
    language: "python",
    title: "Black-76 caplet and swaption pricing",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def black76(F: float, K: float, T: float, sigma: float,
            df: float, notional: float = 1.0,
            option_type: str = "call") -> float:
    """Black-76 formula for options on forwards/futures."""
    d1 = (np.log(F/K) + 0.5*sigma**2*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    if option_type == "call":
        return notional * df * (F*norm.cdf(d1) - K*norm.cdf(d2))
    else:
        return notional * df * (K*norm.cdf(-d2) - F*norm.cdf(-d1))

def caplet_black76(F_L: float, K: float, T_fix: float, T_pay: float,
                   sigma: float, tau: float, notional: float = 1e6) -> float:
    """
    Caplet pays notional * tau * max(L(T_fix) - K, 0) at T_pay.
    F_L = forward LIBOR for [T_fix, T_pay].
    """
    df = np.exp(-0.04 * T_pay)  # flat discount (4% rate)
    return black76(F_L, K, T_fix, sigma, df, notional * tau, "call")

def swaption_black76(S_fwd: float, K: float, T_exp: float,
                     sigma: float, annuity: float,
                     notional: float = 1e6,
                     payer: bool = True) -> float:
    """
    Payer swaption: right to enter pay-fixed swap.
    annuity = sum of discount factors * accrual fractions.
    """
    opt_type = "call" if payer else "put"
    return black76(S_fwd, K, T_exp, sigma, 1.0,
                   notional * annuity, opt_type)

def implied_vol_black76(price: float, F: float, K: float, T: float,
                        df: float, notional: float = 1.0,
                        opt_type: str = "call") -> float:
    """Solve for implied vol via bisection."""
    from scipy.optimize import brentq
    def obj(sigma):
        return black76(F, K, T, sigma, df, notional, opt_type) - price
    return brentq(obj, 1e-6, 5.0)

# Demo
F_L, K_cap, T_fix, T_pay, tau = 0.05, 0.045, 1.0, 1.25, 0.25
sigma_cap = 0.20
caplet = caplet_black76(F_L, K_cap, T_fix, T_pay, sigma_cap, tau)
print(f"Caplet price: \${caplet:,.2f}")

S_swap, K_sw, T_sw, sigma_sw = 0.048, 0.05, 2.0, 0.18
# 5y swap, semi-annual: annuity approx
annuity = sum(0.5 * np.exp(-0.04 * (T_sw + 0.5*i)) for i in range(1, 11))
sw = swaption_black76(S_swap, K_sw, T_sw, sigma_sw, annuity)
print(f"Payer swaption: \${sw:,.2f}")`,
    explanation: "Black-76 (1976) prices options on forwards/futures using the forward price as the underlying. Caplets use forward LIBOR; swaptions use the forward swap rate with the annuity as the 'discount'. The standard model for caps/floors and European swaptions.",
  },
  {
    id: "pyfin-20260616-b1-risk-parity",
    language: "python",
    title: "Equal risk contribution (risk parity) portfolio",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def portfolio_vol(w: np.ndarray, cov: np.ndarray) -> float:
    return np.sqrt(w @ cov @ w)

def risk_contributions(w: np.ndarray, cov: np.ndarray) -> np.ndarray:
    """Marginal risk contribution * weight = component risk."""
    sigma = portfolio_vol(w, cov)
    mcr = cov @ w / sigma   # marginal contribution to risk
    return w * mcr          # component risk contribution

def equal_risk_contribution(cov: np.ndarray) -> np.ndarray:
    """Find weights where each asset contributes equally to total risk."""
    n = len(cov)
    target_rc = np.ones(n) / n  # equal share for each asset

    def objective(w):
        w = np.abs(w)
        w /= w.sum()
        rc = risk_contributions(w, cov)
        rc /= rc.sum()  # normalise
        return np.sum((rc - target_rc)**2)

    # Start from vol-weighted initial guess
    vol = np.sqrt(np.diag(cov))
    w0 = (1.0 / vol) / (1.0 / vol).sum()

    constraints = [{"type": "eq", "fun": lambda w: w.sum() - 1}]
    bounds = [(0.0, 1.0)] * n
    res = minimize(objective, w0, method="SLSQP",
                   bounds=bounds, constraints=constraints,
                   options={"ftol": 1e-12, "maxiter": 1000})
    w = np.abs(res.x)
    return w / w.sum()

# Demo
np.random.seed(42)
n = 5
# Simulate covariance matrix
vols = np.array([0.10, 0.15, 0.20, 0.12, 0.18])
corr = np.array([[1.0, 0.3, 0.2, 0.1, 0.15],
                 [0.3, 1.0, 0.4, 0.2, 0.25],
                 [0.2, 0.4, 1.0, 0.15, 0.30],
                 [0.1, 0.2, 0.15, 1.0, 0.20],
                 [0.15, 0.25, 0.30, 0.20, 1.0]])
cov = np.outer(vols, vols) * corr

w_erc = equal_risk_contribution(cov)
rc = risk_contributions(w_erc, cov)
print("ERC weights:", np.round(w_erc, 4))
print("Risk contrib:", np.round(rc / rc.sum(), 4))
print("Portfolio vol:", f"{portfolio_vol(w_erc, cov)*100:.2f}%")`,
    explanation: "Risk parity allocates weights so each asset contributes equally to total portfolio risk (not equal dollar weights). Solves for weights where w_i * (Sigma*w)_i / sigma_p is the same for all i. Used by Bridgewater's All-Weather and similar strategies.",
  },
  {
    id: "pyfin-20260616-b1-yield-pca",
    language: "python",
    title: "PCA on yield curve – level, slope, curvature",
    tag: "finance",
    code: `import numpy as np
from sklearn.preprocessing import StandardScaler

def yield_curve_pca(yields_matrix: np.ndarray,
                    n_components: int = 3) -> dict:
    """
    yields_matrix: shape (T, M) — T daily snapshots, M maturities.
    Returns principal components and explained variance.
    """
    # Work with yield changes (stationary)
    changes = np.diff(yields_matrix, axis=0)

    # Standardise across maturities
    scaler = StandardScaler()
    changes_std = scaler.fit_transform(changes)

    # PCA via SVD
    U, s, Vt = np.linalg.svd(changes_std, full_matrices=False)
    eigenvalues = (s**2) / (len(changes) - 1)
    total_var = eigenvalues.sum()
    explained = eigenvalues / total_var

    components = Vt[:n_components]  # (n_components, M)
    scores = changes_std @ components.T  # (T-1, n_components)

    return {
        "components": components,
        "scores": scores,
        "explained_variance": explained[:n_components],
        "loadings": components * scaler.scale_,  # rescale to yield units
    }

def interpret_components(result: dict, maturities: list):
    names = ["Level", "Slope", "Curvature"]
    for i, (comp, ev, name) in enumerate(
            zip(result["components"],
                result["explained_variance"],
                names)):
        loadings = result["loadings"][i]
        print(f"PC{i+1} ({name}) — explained var: {ev*100:.1f}%")
        for T, load in zip(maturities, loadings):
            bar = "#" * int(abs(load) * 500)
            sign = "+" if load > 0 else "-"
            print(f"  {T:5.1f}y: {sign}{bar}")
        print()

# Simulate yield curve data
np.random.seed(42)
maturities = [0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30]
T = 500  # trading days
# Level factor drives parallel shifts
level = np.cumsum(np.random.normal(0, 0.002, T))
slope = np.cumsum(np.random.normal(0, 0.001, T))
curve = np.cumsum(np.random.normal(0, 0.0008, T))

loadings_true = np.array(maturities)
yields = np.outer(level, np.ones(10)) \
       + np.outer(slope, np.linspace(1, -1, 10)) \
       + np.outer(curve, np.sin(np.linspace(0, np.pi, 10)))
yields += 0.04  # base level

result = yield_curve_pca(yields)
interpret_components(result, maturities)`,
    explanation: "Three principal components explain >95% of yield curve variation: PC1=level (parallel shift), PC2=slope (short vs long rates), PC3=curvature (belly vs wings). Used by fixed-income PMs for duration/curve hedging and relative value trades.",
  },
  {
    id: "pyfin-20260616-b1-gamma-hedge",
    language: "python",
    title: "Gamma hedging P&L decomposition",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def bs_greeks(S, K, r, T, sigma):
    if T <= 0:
        delta = 1.0 if S > K else 0.0
        return {"price": max(S-K, 0), "delta": delta,
                "gamma": 0, "theta": 0, "vega": 0}
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    price = S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)
    delta = norm.cdf(d1)
    gamma = norm.pdf(d1) / (S * sigma * np.sqrt(T))
    theta = (-(S * norm.pdf(d1) * sigma / (2*np.sqrt(T)))
             - r*K*np.exp(-r*T)*norm.cdf(d2)) / 365
    vega = S * norm.pdf(d1) * np.sqrt(T) / 100  # per 1 vol point
    return {"price": price, "delta": delta, "gamma": gamma,
            "theta": theta, "vega": vega}

def gamma_hedge_simulation(S0=100, K=100, r=0.05, T=0.25, sigma=0.20,
                           n_steps=63, n_paths=1000, seed=42):
    """Simulate delta-hedged book and decompose P&L."""
    rng = np.random.default_rng(seed)
    dt = T / n_steps
    results = []

    for _ in range(n_paths):
        S = S0
        g = bs_greeks(S, K, r, T, sigma)
        option_value = g["price"]
        hedge = -g["delta"]  # short delta per long option
        cash = option_value + g["delta"] * S  # initial cash

        total_pnl = 0.0
        gamma_pnl = 0.0
        theta_pnl = 0.0

        t = T
        for step in range(n_steps):
            dS = S * ((r - 0.5*sigma**2)*dt
                      + sigma*np.sqrt(dt)*rng.standard_normal())
            gamma_pnl += 0.5 * g["gamma"] * dS**2
            theta_pnl += g["theta"] * dt * 365  # convert back to day units

            S += dS
            t -= dt
            g_new = bs_greeks(S, K, r, max(t, 1e-6), sigma)

            # Rebalance delta hedge
            delta_change = g_new["delta"] - g["delta"]
            cash -= delta_change * S
            cash *= np.exp(r * dt)
            hedge += delta_change
            g = g_new

        # Terminal P&L
        payoff = max(S - K, 0)
        final_pnl = payoff + hedge * S + cash
        results.append({"total": final_pnl,
                        "gamma": gamma_pnl,
                        "theta": theta_pnl})

    total = np.mean([r["total"] for r in results])
    gamma_avg = np.mean([r["gamma"] for r in results])
    theta_avg = np.mean([r["theta"] for r in results])
    print(f"Mean P&L:        {total:.4f} (expect ~0)")
    print(f"Mean Gamma P&L:  {gamma_avg:.4f}")
    print(f"Mean Theta P&L:  {theta_avg:.4f}")
    print(f"Gamma + Theta:   {gamma_avg + theta_avg:.4f}")

gamma_hedge_simulation()`,
    explanation: "A delta-hedged long option earns from gamma (0.5*Gamma*dS^2) and pays theta (time decay). In Black-Scholes these exactly cancel in expectation. This simulation decomposes realized P&L into gamma and theta components, verifying the hedge.",
  },
  {
    id: "pyfin-20260616-b1-treynor-black",
    language: "python",
    title: "Treynor-Black model – appraisal ratio portfolio",
    tag: "finance",
    code: `import numpy as np

def treynor_black(alphas: np.ndarray, betas: np.ndarray,
                  residual_vars: np.ndarray, mkt_return: float,
                  mkt_var: float) -> dict:
    """
    Treynor-Black (1973): optimal mix of active portfolio with passive.
    alphas:        Jensen's alpha for each active bet
    betas:         CAPM betas
    residual_vars: idiosyncratic variance (sigma_eps^2)
    """
    # Appraisal ratios
    ar = alphas / residual_vars  # alpha / sigma_eps^2

    # Active portfolio weights (proportional to alpha/sigma_eps^2)
    w_active_unnorm = ar / residual_vars
    # w_A normalised (can be negative = short)
    w_A = w_active_unnorm / w_active_unnorm.sum()

    # Active portfolio parameters
    alpha_A = (w_A * alphas).sum()
    beta_A  = (w_A * betas).sum()
    var_A   = (w_A**2 * residual_vars).sum()

    # Sharpe ratio squared of active vs passive
    sharpe2_mkt = mkt_return**2 / mkt_var
    ar2_A = alpha_A**2 / var_A

    # Optimal weight in active portfolio (Treynor-Black formula)
    w0 = (alpha_A / var_A) / (mkt_return / mkt_var)  # initial weight
    # Adjusted for beta
    w_opt = w0 / (1 + (1 - beta_A) * w0)

    # Combined portfolio
    alpha_p = w_opt * alpha_A
    beta_p  = w_opt * beta_A + (1 - w_opt)
    var_p   = (w_opt**2 * var_A + beta_p**2 * mkt_var)

    sharpe2_p = sharpe2_mkt + ar2_A
    information_ratio = alpha_A / np.sqrt(var_A)

    return {
        "active_weights": w_A,
        "w_active_in_portfolio": w_opt,
        "alpha_portfolio": alpha_p,
        "beta_portfolio": beta_p,
        "information_ratio": information_ratio,
        "sharpe2_improvement": ar2_A / sharpe2_mkt,
    }

# Demo
alphas = np.array([0.02, -0.01, 0.015, 0.03, -0.005])
betas  = np.array([1.2,   0.8,  1.0,   1.5,   0.6])
resid_vars = np.array([0.04, 0.02, 0.03, 0.05, 0.015])
mkt_excess_ret = 0.06
mkt_var = 0.04  # annual

result = treynor_black(alphas, betas, resid_vars, mkt_excess_ret, mkt_var)
print(f"Active portfolio weight: {result['w_active_in_portfolio']:.3f}")
print(f"Portfolio alpha:         {result['alpha_portfolio']*100:.2f}%")
print(f"Portfolio beta:          {result['beta_portfolio']:.3f}")
print(f"Information ratio:       {result['information_ratio']:.3f}")
print(f"Sharpe² improvement:     {result['sharpe2_improvement']*100:.1f}%")`,
    explanation: "Treynor-Black model combines a passive market portfolio with an active portfolio of analyst bets. The optimal active weight equals (alpha_A/sigma_A^2) / (mu_M/sigma_M^2), adjusted for beta. IR of the active book determines the Sharpe improvement.",
  },
  {
    id: "pyfin-20260616-b1-discrete-delta",
    language: "python",
    title: "Discrete delta hedging simulation",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def bs_delta(S, K, r, T, sigma):
    if T < 1e-8:
        return 1.0 if S > K else 0.0
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    return norm.cdf(d1)

def bs_price(S, K, r, T, sigma):
    if T < 1e-8:
        return max(S - K, 0.0)
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

def discrete_hedge_pnl(S0=100, K=100, r=0.05, T=0.25, sigma=0.20,
                       rebal_freq: int = 5, n_paths: int = 5000,
                       seed: int = 42) -> dict:
    """
    Simulate hedging error for a short call with rebalancing every
    rebal_freq days. Returns distribution of hedging P&L.
    """
    rng = np.random.default_rng(seed)
    dt_daily = 1/252
    n_days = int(T * 252)
    pnls = []

    for _ in range(n_paths):
        S = S0
        t = T
        premium = bs_price(S, K, r, T, sigma)
        delta = bs_delta(S, K, r, T, sigma)
        cash = premium - delta * S  # short option, long delta shares

        for day in range(1, n_days + 1):
            dS = S * ((r - 0.5*sigma**2)*dt_daily
                      + sigma*np.sqrt(dt_daily)*rng.standard_normal())
            S += dS
            t -= dt_daily
            cash *= np.exp(r * dt_daily)

            if day % rebal_freq == 0 or day == n_days:
                new_delta = bs_delta(S, K, r, max(t, 0), sigma)
                cash -= (new_delta - delta) * S
                delta = new_delta

        # Settlement
        payoff = max(S - K, 0.0)
        pnls.append(cash + delta * S - payoff)

    pnls = np.array(pnls)
    return {
        "mean_pnl":    pnls.mean(),
        "std_pnl":     pnls.std(),
        "p5":          np.percentile(pnls, 5),
        "p95":         np.percentile(pnls, 95),
        "hedge_error": pnls.std(),
    }

for freq in [1, 5, 21]:
    res = discrete_hedge_pnl(rebal_freq=freq)
    print(f"Rebal every {freq:2d}d: "
          f"mean={res['mean_pnl']:+.4f} "
          f"std={res['std_pnl']:.4f} "
          f"p5={res['p5']:.4f}")`,
    explanation: "Discrete rebalancing creates hedging error proportional to sqrt(dt) * Gamma. More frequent rebalancing reduces std of P&L but increases transaction costs. The tradeoff determines the optimal hedging frequency in practice.",
  },
  {
    id: "pyfin-20260616-b1-age-weighted-var",
    language: "python",
    title: "Age-weighted historical simulation VaR",
    tag: "finance",
    code: `import numpy as np

def age_weighted_var(returns: np.ndarray, alpha: float = 0.99,
                     decay: float = 0.98) -> float:
    """
    BRW (Boudoukh-Richardson-Whitelaw) age-weighted historical VaR.
    Recent observations get higher weight via exponential decay.
    """
    n = len(returns)
    # Geometric weights: most recent gets highest weight
    weights = decay ** np.arange(n - 1, -1, -1)  # [decay^(n-1), ..., 1]
    weights /= weights.sum()

    # Sort losses descending (most negative return = largest loss)
    losses = -returns
    sort_idx = np.argsort(losses)[::-1]
    sorted_losses = losses[sort_idx]
    sorted_weights = weights[sort_idx]

    # Find VaR: cumulative weight crosses (1-alpha)
    cum_weights = np.cumsum(sorted_weights)
    threshold = 1 - alpha
    var_idx = np.searchsorted(cum_weights, threshold)
    var = sorted_losses[var_idx]

    # ES: weighted average of losses beyond VaR
    tail_mask = np.arange(n) <= var_idx
    total_tail_weight = sorted_weights[tail_mask].sum()
    es = (sorted_losses[tail_mask] * sorted_weights[tail_mask]).sum()
    es /= total_tail_weight

    return var, es

def compare_methods(returns: np.ndarray, alpha: float = 0.99):
    """Compare equal-weight vs age-weighted vs parametric VaR."""
    from scipy.stats import norm

    # Equal-weight historical
    var_ew = np.percentile(-returns, alpha * 100)
    es_ew  = (-returns)[(-returns) >= var_ew].mean()

    # Age-weighted
    var_aw, es_aw = age_weighted_var(returns, alpha)

    # Parametric
    mu, sigma = returns.mean(), returns.std(ddof=1)
    var_par = -(mu + sigma * norm.ppf(1 - alpha))

    print(f"{'Method':<20} {'VaR':>8} {'ES':>8}")
    print("-" * 40)
    print(f"{'Equal-weight':<20} {var_ew*100:>7.2f}% {es_ew*100:>7.2f}%")
    print(f"{'Age-weighted':<20} {var_aw*100:>7.2f}% {es_aw*100:>7.2f}%")
    print(f"{'Parametric':<20} {var_par*100:>7.2f}%       N/A")

# Simulate returns with a vol spike at the end
rng = np.random.default_rng(42)
n = 500
vol = np.concatenate([np.ones(400)*0.01, np.ones(100)*0.025])
returns = rng.standard_normal(n) * vol - 0.0002

compare_methods(returns)`,
    explanation: "BRW age-weighting gives more weight to recent observations in historical simulation VaR. Decay factor 0.94-0.99 makes VaR more responsive to recent vol changes than equal-weight HS, while retaining the non-parametric nature.",
  },
  {
    id: "pyfin-20260616-b1-svensson",
    language: "python",
    title: "Svensson yield curve – 6-parameter model",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def svensson_yield(tau: float, params: np.ndarray) -> float:
    """
    Svensson (1994) extended Nelson-Siegel with second hump.
    params = [beta0, beta1, beta2, beta3, lam1, lam2]
    """
    b0, b1, b2, b3, l1, l2 = params
    x1 = l1 * tau
    x2 = l2 * tau
    load1 = (1 - np.exp(-x1)) / x1
    load2 = load1 - np.exp(-x1)
    load3 = (1 - np.exp(-x2)) / x2 - np.exp(-x2)
    return b0 + b1*load1 + b2*load2 + b3*load3

def svensson_yields(taus: np.ndarray, params: np.ndarray) -> np.ndarray:
    return np.array([svensson_yield(t, params) for t in taus])

def fit_svensson(maturities: np.ndarray, yields: np.ndarray,
                 n_starts: int = 10) -> np.ndarray:
    """Multi-start optimization to avoid local minima."""
    rng = np.random.default_rng(0)
    best_res = None
    best_obj = np.inf

    for _ in range(n_starts):
        p0 = np.array([
            rng.uniform(0.02, 0.06),   # beta0: long rate
            rng.uniform(-0.02, 0.02),  # beta1: slope
            rng.uniform(-0.02, 0.02),  # beta2: curvature1
            rng.uniform(-0.01, 0.01),  # beta3: curvature2
            rng.uniform(0.5, 3.0),     # lam1
            rng.uniform(0.5, 3.0),     # lam2
        ])

        def obj(p):
            if p[4] <= 0 or p[5] <= 0 or abs(p[4] - p[5]) < 0.1:
                return 1e9
            return np.sum((svensson_yields(maturities, p) - yields)**2)

        res = minimize(obj, p0, method="Nelder-Mead",
                       options={"xatol": 1e-10, "maxiter": 5000})
        if res.fun < best_obj:
            best_obj = res.fun
            best_res = res.x

    return best_res

# Demo: fit to a humped yield curve
maturities = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10, 15, 20, 30])
yields = np.array([0.038, 0.040, 0.042, 0.044, 0.045,
                   0.046, 0.047, 0.047, 0.046, 0.045, 0.044])

params = fit_svensson(maturities, yields)
fitted = svensson_yields(maturities, params)
rmse = np.sqrt(np.mean((fitted - yields)**2)) * 10000

b0, b1, b2, b3, l1, l2 = params
print(f"beta0={b0*100:.2f}% beta1={b1*100:.2f}% beta2={b2*100:.2f}%")
print(f"beta3={b3*100:.2f}% lam1={l1:.3f} lam2={l2:.3f}")
print(f"Fit RMSE: {rmse:.2f} bps")`,
    explanation: "Svensson adds a second curvature term (beta3, lam2) to Nelson-Siegel, allowing two humps. Used by the Bundesbank and ECB for official yield curve publication. Multi-start optimization is important as the objective has many local minima.",
  },
  {
    id: "pyfin-20260616-b1-garch-forecast",
    language: "python",
    title: "Multi-step GARCH(1,1) volatility forecast",
    tag: "finance",
    code: `import numpy as np

def garch_log_likelihood(params: np.ndarray,
                         returns: np.ndarray) -> float:
    omega, alpha, beta = params
    if omega <= 0 or alpha < 0 or beta < 0 or alpha + beta >= 1:
        return 1e9
    n = len(returns)
    sigma2 = np.var(returns) * np.ones(n)
    ll = 0.0
    for t in range(1, n):
        sigma2[t] = omega + alpha*returns[t-1]**2 + beta*sigma2[t-1]
        ll += np.log(sigma2[t]) + returns[t]**2 / sigma2[t]
    return 0.5 * ll

def fit_garch(returns: np.ndarray) -> tuple:
    from scipy.optimize import minimize
    res = minimize(
        garch_log_likelihood,
        x0=[1e-6, 0.08, 0.88],
        args=(returns,),
        method="Nelder-Mead",
        options={"xatol": 1e-8, "maxiter": 5000},
    )
    return tuple(res.x)

def garch_variance_path(returns: np.ndarray,
                        omega: float, alpha: float, beta: float
                        ) -> np.ndarray:
    """In-sample conditional variance."""
    n = len(returns)
    sigma2 = np.empty(n)
    sigma2[0] = omega / (1 - alpha - beta)
    for t in range(1, n):
        sigma2[t] = omega + alpha*returns[t-1]**2 + beta*sigma2[t-1]
    return sigma2

def garch_forecast(sigma2_T: float, omega: float, alpha: float,
                   beta: float, h: int) -> np.ndarray:
    """
    h-step-ahead GARCH variance forecasts.
    E[sigma^2_{T+h}] = LR_var + (alpha+beta)^h * (sigma2_T - LR_var)
    """
    lr_var = omega / (1 - alpha - beta)
    persistence = alpha + beta
    forecasts = np.empty(h)
    for k in range(1, h + 1):
        forecasts[k-1] = lr_var + persistence**k * (sigma2_T - lr_var)
    return forecasts

# Demo
rng = np.random.default_rng(42)
n = 2000
omega_true, alpha_true, beta_true = 2e-6, 0.09, 0.88
sigma2 = np.empty(n)
sigma2[0] = omega_true / (1 - alpha_true - beta_true)
eps = rng.standard_normal(n)
returns = np.empty(n)
returns[0] = np.sqrt(sigma2[0]) * eps[0]
for t in range(1, n):
    sigma2[t] = omega_true + alpha_true*returns[t-1]**2 + beta_true*sigma2[t-1]
    returns[t] = np.sqrt(sigma2[t]) * eps[t]

omega_f, alpha_f, beta_f = fit_garch(returns)
print(f"omega={omega_f:.2e}, alpha={alpha_f:.4f}, beta={beta_f:.4f}")
print(f"Persistence: {alpha_f+beta_f:.4f}")

sv = garch_variance_path(returns, omega_f, alpha_f, beta_f)
fcast = garch_forecast(sv[-1], omega_f, alpha_f, beta_f, h=22)
ann_vol = np.sqrt(fcast * 252) * 100
print(f"1d  vol forecast: {ann_vol[0]:.2f}%")
print(f"5d  vol forecast: {ann_vol[4]:.2f}%")
print(f"22d vol forecast: {ann_vol[-1]:.2f}%")`,
    explanation: "GARCH(1,1) mean-reverts to long-run variance omega/(1-alpha-beta) at rate (alpha+beta) per period. H-step forecast is a convex combination of current variance and long-run variance. Persistence near 1 means slow mean-reversion (high vol clustering).",
  },
  {
    id: "pyfin-20260616-b1-bond-analytics",
    language: "python",
    title: "Bond analytics – DV01, modified duration, convexity",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import brentq

def bond_price(coupon: float, face: float, ytm: float,
               n_periods: int, freq: int = 2) -> float:
    """Clean price of a coupon bond (semi-annual by default)."""
    c = coupon * face / freq
    y = ytm / freq
    t = np.arange(1, n_periods + 1)
    pv_coupons = c * np.sum(1 / (1 + y)**t)
    pv_face    = face / (1 + y)**n_periods
    return pv_coupons + pv_face

def ytm_from_price(price: float, coupon: float, face: float,
                   n_periods: int, freq: int = 2) -> float:
    """Solve for YTM given dirty price."""
    def obj(ytm):
        return bond_price(coupon, face, ytm, n_periods, freq) - price
    return brentq(obj, 0.0001, 0.5)

def modified_duration(coupon: float, face: float, ytm: float,
                      n_periods: int, freq: int = 2) -> float:
    """Macaulay duration / (1 + y/freq) in years."""
    c = coupon * face / freq
    y = ytm / freq
    t = np.arange(1, n_periods + 1)
    cash_flows = np.full(n_periods, c)
    cash_flows[-1] += face
    pv = cash_flows / (1 + y)**t
    mac_dur_periods = np.dot(t, pv) / pv.sum()
    mac_dur_years = mac_dur_periods / freq
    mod_dur = mac_dur_years / (1 + ytm / freq)
    return mod_dur

def dv01(coupon: float, face: float, ytm: float,
         n_periods: int, freq: int = 2) -> float:
    """Dollar value of 1 basis point (01)."""
    p_up   = bond_price(coupon, face, ytm + 0.0001, n_periods, freq)
    p_down = bond_price(coupon, face, ytm - 0.0001, n_periods, freq)
    return (p_down - p_up) / 2

def convexity(coupon: float, face: float, ytm: float,
              n_periods: int, freq: int = 2) -> float:
    """Bond convexity (second derivative of price w.r.t. yield, scaled)."""
    c = coupon * face / freq
    y = ytm / freq
    t = np.arange(1, n_periods + 1)
    cash_flows = np.full(n_periods, c)
    cash_flows[-1] += face
    pv = cash_flows / (1 + y)**t
    price = pv.sum()
    conv_periods = np.dot(t * (t + 1), pv) / price
    return conv_periods / (freq**2 * (1 + y)**2)

# Demo
coupon = 0.05   # 5% annual coupon
face   = 1000
ytm    = 0.045  # 4.5% yield
n_per  = 20     # 10y, semi-annual = 20 periods

price = bond_price(coupon, face, ytm, n_per)
md    = modified_duration(coupon, face, ytm, n_per)
d01   = dv01(coupon, face, ytm, n_per)
conv  = convexity(coupon, face, ytm, n_per)

print(f"Price:             \${price:.4f}")
print(f"YTM:               {ytm*100:.2f}%")
print(f"Modified Duration: {md:.4f} years")
print(f"DV01:              \${d01:.4f}")
print(f"Convexity:         {conv:.4f}")

# Taylor approximation for +50bps shock
dy = 0.005
approx = price * (-md * dy + 0.5 * conv * dy**2)
actual = bond_price(coupon, face, ytm + dy, n_per) - price
print(f"\\n+50bp shock — Taylor: \${approx:.4f}, Actual: \${actual:.4f}")`,
    explanation: "Modified duration approximates price sensitivity: dP ≈ -MD * P * dy. DV01 = MD * P / 10000 gives dollar sensitivity per basis point. Convexity correction matters for large rate moves. Used for rate risk management and hedge ratio calculation.",
  },
  {
    id: "pyfin-20260616-b1-ou-estimation",
    language: "python",
    title: "Ornstein-Uhlenbeck mean-reversion parameter estimation (MLE)",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def ou_mle(data: np.ndarray, dt: float) -> dict:
    """
    Exact discrete-time MLE for OU process:
    X_{t+dt} = X_t * exp(-kappa*dt) + theta*(1-exp(-kappa*dt)) + eps
    eps ~ N(0, sigma^2/(2*kappa) * (1-exp(-2*kappa*dt)))
    """
    n = len(data) - 1
    x0, x1 = data[:-1], data[1:]

    def neg_log_likelihood(params):
        kappa, theta, sigma = params
        if kappa <= 0 or sigma <= 0:
            return 1e9
        e = np.exp(-kappa * dt)
        mu_cond = x0 * e + theta * (1 - e)
        var_cond = sigma**2 / (2 * kappa) * (1 - e**2)
        if var_cond <= 0:
            return 1e9
        residuals = x1 - mu_cond
        ll = (0.5 * np.log(2 * np.pi * var_cond)
              + residuals**2 / (2 * var_cond))
        return ll.sum()

    # Initial guess via OLS regression X_{t+1} ~ a + b*X_t
    b = np.cov(x1, x0)[0, 1] / np.var(x0)
    a = x1.mean() - b * x0.mean()
    kappa_init = max(-np.log(b) / dt, 0.01)
    theta_init = a / (1 - b)
    sigma_init = np.std(x1 - a - b * x0) * np.sqrt(2 * kappa_init / (1 - b**2))

    res = minimize(neg_log_likelihood, [kappa_init, theta_init, sigma_init],
                   method="Nelder-Mead",
                   options={"xatol": 1e-8, "maxiter": 5000})

    kappa, theta, sigma = res.x
    half_life = np.log(2) / kappa
    lr_var = sigma**2 / (2 * kappa)
    return {"kappa": kappa, "theta": theta, "sigma": sigma,
            "half_life_days": half_life / dt,
            "long_run_vol": np.sqrt(lr_var)}

# Demo: simulate OU then estimate
rng = np.random.default_rng(42)
dt  = 1/252
kappa_true, theta_true, sigma_true = 5.0, 0.0, 0.15
n   = 1000
X   = np.zeros(n)
for t in range(1, n):
    e = np.exp(-kappa_true * dt)
    mu = X[t-1] * e + theta_true * (1 - e)
    std = np.sqrt(sigma_true**2 / (2 * kappa_true) * (1 - e**2))
    X[t] = mu + std * rng.standard_normal()

res = ou_mle(X, dt)
print(f"True:      kappa={kappa_true:.2f}, theta={theta_true:.4f}, sigma={sigma_true:.4f}")
print(f"Estimated: kappa={res['kappa']:.2f}, theta={res['theta']:.4f}, sigma={res['sigma']:.4f}")
print(f"Half-life: {res['half_life_days']:.1f} days")
print(f"LR vol:    {res['long_run_vol']*100:.2f}%")`,
    explanation: "The OU process dX = kappa*(theta-X)*dt + sigma*dW has an exact conditional Gaussian distribution, enabling exact MLE. Kappa controls mean-reversion speed; half-life = ln(2)/kappa. Used to estimate pair-trading entry/exit timing.",
  },
  {
    id: "pyfin-20260616-b1-levy-asian",
    language: "python",
    title: "Lévy approximation for arithmetic Asian options",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def levy_asian(S0: float, K: float, r: float, T: float, sigma: float,
               n_obs: int, option_type: str = "call") -> float:
    """
    Lévy (1992) moment-matching approximation for arithmetic Asian.
    Matches first two moments of arithmetic average to log-normal.
    """
    dt = T / n_obs
    obs_times = np.arange(1, n_obs + 1) * dt

    # E[S_i] under risk-neutral measure
    forward = S0 * np.exp(r * obs_times)

    # E[A] = mean of E[S_i]
    E_A = forward.mean()

    # E[A^2] via covariance structure
    # E[S_i * S_j] = S0^2 * exp((r+sigma^2/2)*(t_i+t_j)) * exp(-sigma^2/2*(ti+tj))
    # Simplified: E[S_i * S_j] = S0^2 * exp(r*(ti+tj) + sigma^2 * min(ti,tj))
    E_A2 = 0.0
    for i, ti in enumerate(obs_times):
        for j, tj in enumerate(obs_times):
            E_A2 += (S0**2
                     * np.exp(r*(ti + tj) + sigma**2 * min(ti, tj)))
    E_A2 /= n_obs**2

    # Fit log-normal: match E[A] and E[A^2]
    sig_A2 = np.log(E_A2 / E_A**2)
    sig_A  = np.sqrt(sig_A2)
    mu_A   = np.log(E_A) - 0.5 * sig_A2

    d1 = (mu_A - np.log(K) + sig_A2) / sig_A
    d2 = d1 - sig_A

    df = np.exp(-r * T)
    if option_type == "call":
        price = df * (E_A * norm.cdf(d1) - K * norm.cdf(d2))
    else:
        price = df * (K * norm.cdf(-d2) - E_A * norm.cdf(-d1))
    return price

def mc_asian(S0, K, r, T, sigma, n_obs, n_paths=100_000, seed=42):
    """Monte Carlo benchmark for arithmetic Asian call."""
    rng = np.random.default_rng(seed)
    dt = T / n_obs
    paths = np.zeros((n_paths, n_obs))
    S = S0 * np.ones(n_paths)
    for i in range(n_obs):
        Z = rng.standard_normal(n_paths)
        S = S * np.exp((r - 0.5*sigma**2)*dt + sigma*np.sqrt(dt)*Z)
        paths[:, i] = S
    avg = paths.mean(axis=1)
    payoff = np.maximum(avg - K, 0.0)
    return np.exp(-r*T) * payoff.mean()

S0, K, r, T, sigma, n_obs = 100, 100, 0.05, 1.0, 0.20, 252
levy   = levy_asian(S0, K, r, T, sigma, n_obs)
mc     = mc_asian(S0, K, r, T, sigma, n_obs)
print(f"Lévy approximation: {levy:.4f}")
print(f"Monte Carlo:        {mc:.4f}")`,
    explanation: "Lévy's method matches the first two moments of the arithmetic average to a log-normal and applies Black-Scholes on the fitted distribution. Fast and accurate (within ~1%) for ATM options. Asian options arise in commodity derivatives and structured products.",
  },
  {
    id: "pyfin-20260616-b1-almgren-chriss",
    language: "python",
    title: "Almgren-Chriss optimal execution (TWAP vs optimal)",
    tag: "finance",
    code: `import numpy as np

def almgren_chriss(X: float, T: float, N: int,
                   sigma: float, eta: float, gamma: float,
                   lam: float) -> dict:
    """
    Almgren-Chriss (2001) optimal liquidation.
    X:     initial position (shares)
    T:     time to complete (years)
    N:     number of trading intervals
    sigma: daily vol of stock price
    eta:   temporary impact coefficient
    gamma: permanent impact coefficient
    lam:   risk-aversion parameter
    """
    dt = T / N
    # Characteristic time scale
    kappa2 = lam * sigma**2 / eta
    kappa  = np.sqrt(kappa2)

    # Optimal trajectory: X_j = X * sinh(kappa*(T-j*dt)) / sinh(kappa*T)
    t = np.linspace(0, T, N + 1)
    X_t = X * np.sinh(kappa * (T - t)) / np.sinh(kappa * T)

    # Trading rates (shares per interval)
    trades = np.diff(X_t)  # negative (selling)

    # Expected cost
    perm_cost = 0.5 * gamma * X**2  # permanent impact (same for all strategies)
    temp_cost = eta / dt * np.sum(trades**2)
    exp_cost  = perm_cost + temp_cost

    # Variance of execution cost
    var_cost = sigma**2 * dt * np.sum(X_t[:-1]**2)

    # TWAP benchmark
    twap_trades = np.full(N, -X / N)
    twap_X      = X - np.arange(1, N+1) * X / N
    twap_temp   = eta / dt * np.sum(twap_trades**2)
    twap_var    = sigma**2 * dt * np.sum(np.concatenate([[X], twap_X])[:-1]**2)

    return {
        "optimal_trajectory": X_t,
        "optimal_trades":     trades,
        "optimal_exp_cost":   exp_cost,
        "optimal_var":        var_cost,
        "twap_exp_cost":      perm_cost + twap_temp,
        "twap_var":           twap_var,
        "kappa":              kappa,
        "half_life":          np.log(2) / kappa if kappa > 0 else np.inf,
    }

X     = 100_000  # shares to sell
T     = 1/252 * 20  # 20 trading days
N     = 20
sigma = 0.02  # daily vol
eta   = 2.5e-7  # temporary impact ($/share per share/day)
gamma = 1.0e-7  # permanent impact
lam   = 1e-5    # risk aversion

res = almgren_chriss(X, T, N, sigma, eta, gamma, lam)
print(f"Optimal expected cost: \${res['optimal_exp_cost']:,.0f}")
print(f"TWAP expected cost:    \${res['twap_exp_cost']:,.0f}")
print(f"Optimal variance:      \${np.sqrt(res['optimal_var']):,.0f}")
print(f"TWAP variance:         \${np.sqrt(res['twap_var']):,.0f}")
print(f"Kappa:  {res['kappa']:.4f}  Half-life: {res['half_life']*252:.1f} days")
print("Shares to trade each day:", np.round(-res['optimal_trades'][:5]).astype(int), "...")`,
    explanation: "Almgren-Chriss minimizes E[cost] + lambda*Var[cost]. High risk aversion (lambda) front-loads trades to reduce timing risk; low lambda back-loads to reduce market impact. Kappa = sqrt(lambda*sigma^2/eta) controls how front-loaded the schedule is.",
  },
  {
    id: "pyfin-20260616-b1-hawkes",
    language: "python",
    title: "Hawkes process for trade arrival intensity",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def simulate_hawkes(mu: float, alpha: float, beta: float,
                    T: float, seed: int = 42) -> np.ndarray:
    """
    Simulate univariate Hawkes process via Ogata's thinning algorithm.
    mu:    baseline intensity
    alpha: self-excitation magnitude (alpha < beta for stability)
    beta:  decay rate of excitation
    """
    rng = np.random.default_rng(seed)
    events = []
    t = 0.0
    lam = mu  # current intensity

    while t < T:
        # Upper bound on intensity
        lam_bar = lam
        # Candidate next event
        dt = rng.exponential(1.0 / lam_bar)
        t += dt

        if t >= T:
            break

        # Decay intensity to time t
        if events:
            lam = mu + (lam - mu) * np.exp(-beta * dt) + alpha
        else:
            lam = mu + alpha

        # Thinning: accept with probability lam/lam_bar
        lam_new = mu + alpha * sum(np.exp(-beta * (t - ti))
                                   for ti in events)
        if rng.uniform() <= lam_new / lam_bar:
            events.append(t)
            lam = lam_new + alpha
        else:
            lam = lam_new

    return np.array(events)

def hawkes_log_likelihood(params: np.ndarray,
                          events: np.ndarray, T: float) -> float:
    mu, alpha, beta = params
    if mu <= 0 or alpha < 0 or beta <= alpha:
        return 1e9
    n = len(events)
    # Recursive computation of intensity
    R = np.zeros(n)  # R[i] = sum_{j<i} exp(-beta*(t_i - t_j))
    for i in range(1, n):
        R[i] = np.exp(-beta*(events[i]-events[i-1])) * (1 + R[i-1])
    intensity_at_events = mu + alpha * R

    # Log-likelihood: sum log lambda(t_i) - integral lambda dt
    ll_sum = np.sum(np.log(intensity_at_events))
    integral = mu * T + alpha/beta * np.sum(1 - np.exp(-beta*(T - events)))
    return -(ll_sum - integral)

def fit_hawkes(events: np.ndarray, T: float) -> dict:
    res = minimize(hawkes_log_likelihood, x0=[0.5, 0.3, 1.0],
                   args=(events, T),
                   method="Nelder-Mead",
                   options={"xatol": 1e-8, "maxiter": 5000})
    mu, alpha, beta = res.x
    return {"mu": mu, "alpha": alpha, "beta": beta,
            "branching_ratio": alpha / beta,
            "mean_intensity": mu / (1 - alpha/beta)}

# Demo
T = 500.0
events = simulate_hawkes(mu=0.5, alpha=0.4, beta=1.2, T=T)
print(f"Simulated {len(events)} events in T={T}s")
print(f"Average rate: {len(events)/T:.2f} events/s")

res = fit_hawkes(events, T)
print(f"Fitted: mu={res['mu']:.3f}, alpha={res['alpha']:.3f}, "
      f"beta={res['beta']:.3f}")
print(f"Branching ratio: {res['branching_ratio']:.3f} (<1 required for stability)")
print(f"Mean intensity:  {res['mean_intensity']:.3f} events/s")`,
    explanation: "Hawkes process is a self-exciting point process where each event increases intensity temporarily. Branching ratio alpha/beta < 1 ensures stationarity. Used to model trade clustering, order flow, and market microstructure events like quote updates.",
  },
];
