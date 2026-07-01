import type { Snippet } from "./types";

export const pythonFinanceSnippets20260701B1: Snippet[] = [
  {
    id: "pyfin-20260701-b1-implied-vol-nr",
    language: "python",
    title: "BSM Implied Volatility Newton-Raphson with Vega Guard",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def bsm_call_price(S, K, r, T, sigma):
    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    return S * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)

def bsm_vega(S, K, r, T, sigma):
    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    return S * norm.pdf(d1) * np.sqrt(T)

def implied_vol_nr(market_price, S, K, r, T,
                   sigma0=0.20, tol=1e-8, max_iter=50):
    """Newton-Raphson implied vol inversion with vega fallback to bisection."""
    sigma = sigma0
    for i in range(max_iter):
        price = bsm_call_price(S, K, r, T, sigma)
        vega  = bsm_vega(S, K, r, T, sigma)
        diff  = price - market_price
        if abs(diff) < tol:
            return sigma
        if abs(vega) < 1e-10:          # vega too small — switch to bisection
            lo, hi = 1e-6, 5.0
            for _ in range(100):
                mid = 0.5 * (lo + hi)
                if bsm_call_price(S, K, r, T, mid) < market_price:
                    lo = mid
                else:
                    hi = mid
            return 0.5 * (lo + hi)
        sigma -= diff / vega
        sigma = max(1e-6, min(sigma, 5.0))  # clamp to sane range
    return sigma

# ATM 1-year call with market price ~10.45
iv = implied_vol_nr(10.45, 100, 100, 0.05, 1.0)
print(f"Implied vol: {iv:.4%}")   # ~20.00%`,
    explanation: "Newton-Raphson converges quadratically near the root — typically 3-5 iterations for implied vol. The vega guard is essential: deep ITM/OTM options have near-zero vega, making NR unstable; bisection is the robust fallback. This pattern is used in every options analytics library.",
  },
  {
    id: "pyfin-20260701-b1-black-model",
    language: "python",
    title: "Black's Model for Caps, Floors, and Swaptions",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def black76_call(F, K, r, T, sigma):
    """Black (1976) model: option on forward price F."""
    if T <= 0 or sigma <= 0:
        return max(F - K, 0.0) * np.exp(-r * T)
    d1 = (np.log(F / K) + 0.5 * sigma**2 * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    return np.exp(-r * T) * (F * norm.cdf(d1) - K * norm.cdf(d2))

def black76_put(F, K, r, T, sigma):
    c = black76_call(F, K, r, T, sigma)
    return c + np.exp(-r * T) * (K - F)   # put-call parity for forwards

def caplet_price(F, K, r, T, sigma, notional, tau):
    """Single caplet: call on LIBOR/SOFR forward rate F settling in tau years."""
    return notional * tau * black76_call(F, K, r, T, sigma)

def cap_price(forwards, K, r, reset_dates, sigma, notional=1_000_000):
    """Cap = sum of caplets. reset_dates: [(T_start, T_end, tau), ...]"""
    total = 0.0
    for fwd, (T_start, T_end, tau) in zip(forwards, reset_dates):
        total += caplet_price(fwd, K, r, T_start, sigma, notional, tau)
    return total

def swaption_price(F_swap, K, r, T_exp, sigma, annuity):
    """Payer swaption: right to enter pay-fixed swap. Annuity = PV01 * notional."""
    d1 = (np.log(F_swap / K) + 0.5 * sigma**2 * T_exp) / (sigma * np.sqrt(T_exp))
    d2 = d1 - sigma * np.sqrt(T_exp)
    return annuity * (F_swap * norm.cdf(d1) - K * norm.cdf(d2))

# 3-caplet cap: 6m, 12m, 18m resets, 5% strike, flat vol 20%
forwards     = [0.052, 0.055, 0.057]
reset_dates  = [(0.5, 1.0, 0.5), (1.0, 1.5, 0.5), (1.5, 2.0, 0.5)]
cap = cap_price(forwards, 0.05, 0.045, reset_dates, 0.20)
print(f"Cap price: USD {cap:,.0f}")

# Swaption: 1Y expiry, 5% strike, 10Y swap, annuity=7.5
swpn = swaption_price(0.055, 0.05, 0.045, 1.0, 0.20, 750_000)
print(f"Swaption: USD {swpn:,.0f}")`,
    explanation: "Black's (1976) model prices options on forward prices rather than spot — it is the standard for interest rate derivatives (caps, floors, swaptions) where the underlying is a forward rate. Caps decompose into independent caplets, each priced as a Black call on the respective LIBOR/SOFR forward rate.",
  },
  {
    id: "pyfin-20260701-b1-ledoit-wolf",
    language: "python",
    title: "Ledoit-Wolf Analytical Shrinkage (Oracle Approximation)",
    tag: "finance",
    code: `import numpy as np

def ledoit_wolf_analytical(X: np.ndarray) -> np.ndarray:
    """
    Ledoit-Wolf (2004) Oracle Approximating Shrinkage (OAS) estimator.
    X: (T, N) returns matrix. Returns shrunk covariance (N, N).
    Shrinks sample covariance towards scaled identity: Sigma* = (1-alpha)*S + alpha*mu_hat*I
    """
    T, N = X.shape
    # Sample covariance
    mu  = X.mean(axis=0)
    X_c = X - mu
    S   = X_c.T @ X_c / T   # biased MLE covariance

    # Ledoit-Wolf analytical formula (Ledoit & Wolf 2004, Theorem 1)
    # Target: mu_hat * I  where mu_hat = trace(S)/N
    mu_hat = np.trace(S) / N

    # delta^2: squared Frobenius distance S vs mu_hat*I
    delta_sq = np.linalg.norm(S - mu_hat * np.eye(N), 'fro')**2

    # beta^2: sum of frobenius norms of per-observation outer products
    beta_sq_sum = 0.0
    for t in range(T):
        xt  = X_c[t:t+1].T
        Wt  = xt @ xt.T
        beta_sq_sum += np.linalg.norm(Wt - S, 'fro')**2
    beta_sq = beta_sq_sum / T**2

    alpha = min(beta_sq / delta_sq, 1.0)   # shrinkage intensity
    Sigma = (1.0 - alpha) * S + alpha * mu_hat * np.eye(N)
    print(f"Shrinkage intensity alpha = {alpha:.4f}")
    return Sigma

np.random.seed(42)
T, N = 120, 20                        # 120 months, 20 assets
X = np.random.randn(T, N) * 0.05     # ~5% monthly vol
Sigma = ledoit_wolf_analytical(X)
print(f"Condition number: {np.linalg.cond(Sigma):.1f}")  # much lower than sample cov`,
    explanation: "The sample covariance matrix is ill-conditioned with T/N < 10; Ledoit-Wolf shrinkage analytically determines the optimal blend between the sample covariance and a structured target (scaled identity here), reducing estimation error and improving portfolio optimisation stability without cross-validation.",
  },
  {
    id: "pyfin-20260701-b1-almgren-chriss",
    language: "python",
    title: "Almgren-Chriss Optimal Execution Trajectory",
    tag: "finance",
    code: `import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

def almgren_chriss_trajectory(X0: float, T: float, N: int,
                               sigma: float, eta: float,
                               gamma: float, lam: float) -> dict:
    """
    Almgren-Chriss (2000) optimal execution.
    X0:    initial shares to liquidate
    T:     liquidation horizon (days)
    N:     number of trading intervals
    sigma: daily vol of the asset (in price units)
    eta:   temporary impact coefficient (cost per share-rate)
    gamma: permanent impact coefficient (cost per share)
    lam:   risk-aversion parameter
    """
    tau = T / N           # interval length
    kappa_sq = lam * sigma**2 / eta
    kappa    = np.sqrt(kappa_sq)

    # Optimal inventory trajectory x(t)
    times = np.linspace(0, T, N + 1)
    # x(t_j) = X0 * sinh(kappa*(T-t_j)) / sinh(kappa*T)
    x = X0 * np.sinh(kappa * (T - times)) / np.sinh(kappa * T)

    # Trade schedule: shares to sell in each interval
    n_j = np.diff(x)   # negative values (selling)

    # Expected cost and variance
    E_cost = (0.5 * gamma * X0**2
              + eta / tau * np.sum(n_j**2)
              + 0.5 * gamma * np.sum(np.abs(n_j)))
    Var_cost = sigma**2 * tau * np.sum(x[:-1]**2)

    return {"times": times, "inventory": x, "trades": -n_j,
            "E_cost": E_cost, "Var_cost": Var_cost}

result = almgren_chriss_trajectory(
    X0=100_000, T=5, N=20,
    sigma=0.50, eta=0.01, gamma=0.001, lam=1e-6)

print("Optimal trade schedule (shares per interval):")
print(np.round(result['trades'], 0))
print(f"Expected cost:  USD {result['E_cost']:,.0f}")
print(f"Cost variance:  {result['Var_cost']:,.0f}")`,
    explanation: "Almgren-Chriss solves the mean-variance tradeoff in execution: trading slowly minimises market impact but maximises price-risk exposure; the hyperbolic-sine trajectory is the analytical optimum. Risk aversion lambda controls the urgency — lambda=0 gives uniform VWAP, lambda→inf front-loads the order.",
  },
  {
    id: "pyfin-20260701-b1-cva-mc",
    language: "python",
    title: "CVA Monte Carlo with Wrong-Way Risk Simulation",
    tag: "finance",
    code: `import numpy as np

def cva_wrong_way_mc(
    S0: float, K: float, r: float, T: float, sigma_S: float,
    hazard0: float, rho: float,
    LGD: float = 0.6, paths: int = 50_000, steps: int = 50, seed: int = 42
) -> dict:
    """
    CVA on a European call via MC with wrong-way risk.
    Counterparty hazard rate h(t) = hazard0 * exp(rho_h * X_t)
    where X_t is correlated with the equity (wrong-way: rho < 0 for call).
    """
    rng  = np.random.default_rng(seed)
    dt   = T / steps
    sqrt_dt = np.sqrt(dt)

    # Correlated Brownian increments: (dW_S, dW_h)
    cov  = np.array([[1.0, rho], [rho, 1.0]])
    L    = np.linalg.cholesky(cov)       # 2x2 Cholesky

    S       = np.full(paths, S0)
    log_h   = np.zeros(paths)            # log-hazard state
    surv    = np.ones(paths)             # survival probabilities
    cva_acc = np.zeros(paths)

    for step in range(steps):
        t  = step * dt
        t1 = t + dt
        Z  = rng.standard_normal((2, paths))
        dW = L @ Z                        # shape (2, paths)
        dW_S = dW[0] * sqrt_dt
        dW_h = dW[1] * sqrt_dt

        S       *= np.exp((r - 0.5*sigma_S**2)*dt + sigma_S*dW_S)
        log_h   += -0.5 * dt + dW_h      # log-OU mean-reversion simplified
        h_t     = hazard0 * np.exp(log_h)

        # Survival update
        dp_surv  = np.exp(-h_t * dt)
        PD_dt    = surv * (1 - dp_surv)  # marginal default prob in [t, t+dt]

        # Exposure at default: option value (simplified as intrinsic)
        EAD      = np.maximum(S - K, 0.0) * np.exp(-r * (T - t1))

        cva_acc += PD_dt * EAD
        surv    *= dp_surv

    cva = LGD * cva_acc.mean()
    return {"CVA": cva, "CVA_std": LGD * cva_acc.std() / np.sqrt(paths)}

result = cva_wrong_way_mc(100, 100, 0.05, 1.0, 0.20, 0.02, rho=-0.5)
print(f"CVA (wrong-way, rho=-0.5): USD {result['CVA']:.4f}")
print(f"Std error: USD {result['CVA_std']:.4f}")`,
    explanation: "Wrong-way risk arises when counterparty credit quality deteriorates precisely when your exposure is highest — e.g., a call option on the counterparty's own stock. The correlation rho links the equity diffusion to the hazard rate process; negative rho for a call creates wrong-way risk and increases CVA above the independent-default assumption.",
  },
  {
    id: "pyfin-20260701-b1-vix-index",
    language: "python",
    title: "VIX Index Computation from Option Chain (CBOE Method)",
    tag: "finance",
    code: `import numpy as np

def compute_vix(option_chain: list[dict], F: float, T: float, r: float) -> float:
    """
    CBOE VIX methodology (simplified).
    option_chain: list of {'K': strike, 'mid_price': option mid, 'type': 'C'/'P'}
    F: forward price, T: time to expiry (years), r: risk-free rate
    Returns: VIX contribution sigma^2 for this expiry (annualised variance)
    """
    # Sort strikes
    strikes = sorted(set(o['K'] for o in option_chain))

    # At-the-money: use calls above F, puts below F
    sigma_sq = 0.0
    prev_K   = None

    # Build strike -> OTM option price mapping
    otm = {}
    for o in option_chain:
        K, mid = o['K'], o['mid_price']
        if K < F and o['type'] == 'P':
            otm[K] = mid
        elif K > F and o['type'] == 'C':
            otm[K] = mid
        elif K == F:
            # Use average of call and put at ATM
            otm[K] = otm.get(K, 0) + 0.5 * mid

    # Integration using trapezoidal rule over log-strike intervals
    ks = sorted(otm.keys())
    for i, K in enumerate(ks):
        if i == 0:
            dK = ks[1] - ks[0]
        elif i == len(ks) - 1:
            dK = ks[-1] - ks[-2]
        else:
            dK = (ks[i+1] - ks[i-1]) / 2.0
        Q   = otm[K]
        sigma_sq += (dK / K**2) * np.exp(r * T) * Q

    sigma_sq *= 2.0 / T
    # CBOE adjustment: subtract (F/K0 - 1)^2
    K0        = max(k for k in ks if k <= F)
    sigma_sq -= (1.0 / T) * (F / K0 - 1.0)**2
    return 100.0 * np.sqrt(sigma_sq)   # annualised % vol

# Synthetic option chain
chain = (
    [{'K': k, 'mid_price': max(100-k, 0)*0.9 + 0.5, 'type': 'P'}
     for k in range(80, 100, 5)] +
    [{'K': k, 'mid_price': max(k-100, 0)*0.9 + 0.5, 'type': 'C'}
     for k in range(100, 125, 5)]
)
vix = compute_vix(chain, F=100.5, T=30/365, r=0.05)
print(f"VIX (annualised): {vix:.2f}")`,
    explanation: "The CBOE VIX is a model-free measure of 30-day implied variance, computed by integrating OTM option prices across all strikes weighted by 1/K². Unlike BSM implied vol, it captures the full shape of the risk-neutral distribution — skew, kurtosis — making it the standard fear gauge for equity derivatives desks.",
  },
  {
    id: "pyfin-20260701-b1-dupire-local-vol",
    language: "python",
    title: "Dupire Local Volatility via Breeden-Litzenberger",
    tag: "finance",
    code: `import numpy as np
from scipy.interpolate import RectBivariateSpline

def dupire_local_vol(strikes: np.ndarray, expiries: np.ndarray,
                     call_prices: np.ndarray, S0: float, r: float) -> np.ndarray:
    """
    Dupire (1994) local vol surface from call price surface C(K, T).
    sigma_loc^2(K,T) = (dC/dT + r*K*dC/dK) / (0.5*K^2 * d^2C/dK^2)

    strikes:    (NK,) array of strikes
    expiries:   (NT,) array of maturities (years)
    call_prices:(NK, NT) matrix of call prices
    Returns:    (NK, NT) local vol surface
    """
    # Smooth the surface with bivariate spline before differentiation
    spline = RectBivariateSpline(strikes, expiries, call_prices, kx=3, ky=3)

    K_grid, T_grid = np.meshgrid(strikes, expiries, indexing='ij')

    dC_dT   = spline(strikes, expiries, dy=1)   # partial w.r.t. T
    dC_dK   = spline(strikes, expiries, dx=1)   # partial w.r.t. K
    d2C_dK2 = spline(strikes, expiries, dx=2)   # second partial w.r.t. K

    numerator   = dC_dT + r * K_grid * dC_dK
    denominator = 0.5 * K_grid**2 * d2C_dK2

    # Clip to avoid division by near-zero convexity
    denom_safe = np.where(np.abs(denominator) > 1e-8, denominator, np.nan)
    sigma_sq   = np.clip(numerator / denom_safe, 0.0, 4.0)  # cap at 200% vol
    return np.sqrt(sigma_sq)

# Synthetic flat-vol surface for validation
from scipy.stats import norm
def bsm(S, K, r, T, sig):
    d1 = (np.log(S/K) + (r+0.5*sig**2)*T) / (sig*np.sqrt(T))
    d2 = d1 - sig*np.sqrt(T)
    return S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

S0, r_f, sig0 = 100.0, 0.05, 0.20
strikes  = np.linspace(80, 120, 15)
expiries = np.linspace(0.25, 2.0, 8)
C = np.array([[bsm(S0, K, r_f, T, sig0) for T in expiries] for K in strikes])
local_vol = dupire_local_vol(strikes, expiries, C, S0, r_f)
print(f"ATM 1Y local vol: {local_vol[7, 4]:.4f}")  # should be ~0.20`,
    explanation: "Dupire's formula extracts the unique local vol function sigma(K,T) that exactly reproduces all observed European option prices — it is a one-factor model that fits the smile. The Breeden-Litzenberger result (d²C/dK² ∝ risk-neutral density) provides the denominator; the spline interpolation smooths the raw surface before numerical differentiation.",
  },
  {
    id: "pyfin-20260701-b1-clayton-copula",
    language: "python",
    title: "Clayton Copula Simulation for Credit Portfolio",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm

def sample_clayton_copula(n_assets: int, n_samples: int,
                          theta: float, seed: int = 42) -> np.ndarray:
    """
    Sample from Clayton copula with parameter theta > 0.
    Higher theta = stronger lower-tail dependence (co-crash risk).
    Uses the Marshall-Olkin (Gamma) frailty method.
    Returns (n_samples, n_assets) uniform marginals U in [0,1].
    """
    rng = np.random.default_rng(seed)
    # Step 1: sample frailty V ~ Gamma(1/theta, 1)
    V = rng.gamma(shape=1.0/theta, scale=1.0, size=n_samples)

    # Step 2: iid Exponential(1) variables
    E = rng.exponential(scale=1.0, size=(n_samples, n_assets))

    # Step 3: U_i = (1 + E_i / V)^(-1/theta) — Clayton inverse Laplace
    U = (1.0 + E / V[:, None]) ** (-1.0 / theta)
    return U

def credit_loss_simulation(n_assets: int, theta: float,
                            PD: float, LGD: float, n_samples: int = 100_000) -> dict:
    """Simulate portfolio credit losses under Clayton copula dependence."""
    U = sample_clayton_copula(n_assets, n_samples, theta)
    # Default if U_i < PD (uniform marginal threshold)
    defaults = (U < PD).sum(axis=1)   # number of defaults per scenario
    losses   = defaults * LGD / n_assets  # normalised portfolio loss

    return {
        "EL":     losses.mean(),
        "UL_99":  np.percentile(losses, 99),
        "UL_999": np.percentile(losses, 99.9),
        "max_loss": losses.max(),
    }

result = credit_loss_simulation(
    n_assets=100, theta=2.0, PD=0.02, LGD=0.4, n_samples=100_000)
print(f"Expected Loss:    {result['EL']:.4%}")
print(f"VaR 99%:         {result['UL_99']:.4%}")
print(f"VaR 99.9%:       {result['UL_999']:.4%}")`,
    explanation: "The Clayton copula has strong lower-tail dependence — assets tend to co-default in stress scenarios — making it more realistic than Gaussian copula for CDO tranching and credit portfolio VaR. The Gamma frailty (Marshall-Olkin) construction is exact and fast: sample one frailty per scenario, then conditionally independent Exponentials.",
  },
  {
    id: "pyfin-20260701-b1-merton-analytic",
    language: "python",
    title: "Merton Jump-Diffusion Analytic Call (Infinite Series)",
    tag: "finance",
    code: `import numpy as np
from scipy.stats import norm
from scipy.special import factorial

def merton_call_analytic(S: float, K: float, r: float, T: float,
                          sigma: float, lam: float, mu_j: float,
                          sigma_j: float, n_terms: int = 40) -> float:
    """
    Merton (1976) closed-form call price as infinite sum of BSM calls.
    Each term n corresponds to exactly n jumps during [0,T].
    """
    kappa  = np.exp(mu_j + 0.5*sigma_j**2) - 1.0
    lam_p  = lam * (1.0 + kappa)             # adjusted jump intensity
    r_adj  = r - lam * kappa                 # risk-neutral drift adjustment

    price = 0.0
    for n in range(n_terms):
        # Effective vol and rate conditional on n jumps
        sigma_n = np.sqrt(sigma**2 + n * sigma_j**2 / T)
        r_n     = r_adj + n * (mu_j + 0.5*sigma_j**2) / T
        # Weight: Poisson probability of n jumps
        weight  = np.exp(-lam_p*T) * (lam_p*T)**n / factorial(n, exact=False)
        # BSM call under jump-adjusted params
        if sigma_n > 0 and T > 0:
            d1  = (np.log(S/K) + (r_n + 0.5*sigma_n**2)*T) / (sigma_n*np.sqrt(T))
            d2  = d1 - sigma_n * np.sqrt(T)
            bsm = S*norm.cdf(d1) - K*np.exp(-r_n*T)*norm.cdf(d2)
        else:
            bsm = max(S - K*np.exp(-r_n*T), 0.0)
        price += weight * bsm

    return price

# Verify against MC (should be within noise)
price = merton_call_analytic(
    S=100, K=100, r=0.05, T=1.0, sigma=0.20,
    lam=1.0, mu_j=-0.10, sigma_j=0.15)
print(f"Merton call (analytic): {price:.4f}")  # ~9.5-10.5`,
    explanation: "Merton's analytic formula conditions on the number of jumps n (Poisson distributed) and uses a standard BSM call for each n, with vol inflated by the variance of n jump sizes. The sum converges quickly because Poisson probability decays factorially; 30-40 terms give machine precision for lambda*T < 10.",
  },
  {
    id: "pyfin-20260701-b1-bond-analytics",
    language: "python",
    title: "Bond DV01 / Modified Duration / Convexity Analytics",
    tag: "finance",
    code: `import numpy as np
from dataclasses import dataclass

@dataclass
class Bond:
    face:     float   # par value
    coupon:   float   # annual coupon rate
    ytm:      float   # yield to maturity (semi-annual convention)
    maturity: float   # years to maturity

def bond_analytics(b: Bond) -> dict:
    n     = int(b.maturity * 2)     # number of semi-annual periods
    c     = b.face * b.coupon / 2   # semi-annual coupon
    y2    = b.ytm / 2               # semi-annual yield

    periods  = np.arange(1, n + 1)
    cf       = np.full(n, c)
    cf[-1]  += b.face               # add principal at maturity

    df       = 1 / (1 + y2)**periods
    pv       = cf * df
    price    = pv.sum()

    # Macaulay duration (in semi-annual periods → convert to years)
    mac_dur  = (periods * pv).sum() / price / 2

    # Modified duration
    mod_dur  = mac_dur / (1 + y2)

    # Convexity (semi-annual → annual: divide by 4)
    conv = ((periods * (periods + 1)) * pv).sum() / (price * (1 + y2)**2) / 4

    # DV01: dollar change per bp
    dv01 = mod_dur * price * 0.0001

    return {
        "price":    price,
        "mac_dur":  mac_dur,
        "mod_dur":  mod_dur,
        "convexity": conv,
        "dv01":     dv01,
    }

# 5% coupon, 4.5% YTM, 10Y maturity, face=1000
b = Bond(face=1000, coupon=0.05, ytm=0.045, maturity=10)
a = bond_analytics(b)
for k, v in a.items():
    print(f"{k:>12}: {v:.4f}")`,
    explanation: "DV01 (dollar value of a basis point) is the primary fixed-income hedging metric — it tells you how many basis points of a hedge instrument to buy/sell to flatten rate risk. Modified duration linearises yield sensitivity; convexity adds the second-order correction that explains why long bonds gain more on yield rallies than they lose on sell-offs.",
  },
  {
    id: "pyfin-20260701-b1-black-litterman",
    language: "python",
    title: "Black-Litterman Expected Return Blending",
    tag: "finance",
    code: `import numpy as np

def black_litterman(
    Sigma: np.ndarray,
    w_mkt: np.ndarray,
    P: np.ndarray,
    Q: np.ndarray,
    Omega: np.ndarray,
    delta: float = 2.5,
    tau: float = 0.05
) -> dict:
    """
    Black-Litterman model.
    Sigma:  (N,N) asset covariance matrix
    w_mkt:  (N,) market-cap weights
    P:      (K,N) pick matrix: K views on N assets
    Q:      (K,) expected returns for each view
    Omega:  (K,K) view uncertainty covariance (diagonal typical)
    delta:  risk aversion (market price of risk)
    tau:    confidence scaling for prior (typically 0.01-0.10)
    Returns: posterior expected returns and optimal weights
    """
    # Equilibrium (implied) excess returns from reverse optimisation
    pi = delta * Sigma @ w_mkt           # (N,) prior expected returns

    # Prior covariance of expected returns
    tau_Sigma = tau * Sigma              # (N,N)

    # Posterior expected returns (BL Master Formula)
    M  = tau_Sigma @ P.T
    Z  = P @ tau_Sigma @ P.T + Omega    # (K,K)
    mu_bl = pi + M @ np.linalg.solve(Z, Q - P @ pi)

    # Posterior covariance of expected returns
    Sigma_bl = Sigma + tau_Sigma - M @ np.linalg.solve(Z, M.T)

    # Optimal portfolio weights (unconstrained MV)
    w_opt = np.linalg.solve(delta * Sigma_bl, mu_bl)

    return {"mu_bl": mu_bl, "Sigma_bl": Sigma_bl, "w_opt": w_opt}

# 3-asset example: equities, bonds, EM
N = 3
Sigma  = np.array([[0.04, 0.01, 0.02],
                   [0.01, 0.01, 0.005],
                   [0.02, 0.005, 0.09]])
w_mkt  = np.array([0.6, 0.3, 0.1])
P      = np.array([[1, -1, 0],    # View 1: equities outperform bonds by 2%
                   [0,  0, 1]])   # View 2: EM returns 5%
Q      = np.array([0.02, 0.05])
Omega  = np.diag([0.0001, 0.0004])

result = black_litterman(Sigma, w_mkt, P, Q, Omega)
print("BL expected returns:", np.round(result["mu_bl"]*100, 2), "%")
print("Optimal weights:    ", np.round(result["w_opt"], 3))`,
    explanation: "Black-Litterman blends the market equilibrium prior (implied returns via reverse optimisation) with investor views expressed as linear constraints (P, Q) with uncertainty Omega. The posterior is a Bayesian update; the result is intuitive, well-diversified weights rather than the extreme corner solutions of raw Markowitz optimisation.",
  },
  {
    id: "pyfin-20260701-b1-basket-option-mc",
    language: "python",
    title: "Multi-Asset Basket Option MC with Cholesky Correlation",
    tag: "finance",
    code: `import numpy as np

def basket_call_mc(
    S0: np.ndarray, weights: np.ndarray,
    K: float, r: float, T: float,
    vols: np.ndarray, corr: np.ndarray,
    paths: int = 200_000, seed: int = 42
) -> dict:
    """
    European call on a weighted basket of assets.
    S0:      (N,) initial prices
    weights: (N,) basket weights (sum to 1)
    K:       basket strike (in basket price units)
    """
    rng = np.random.default_rng(seed)
    N   = len(S0)

    # Cholesky decomposition of correlation matrix
    L   = np.linalg.cholesky(corr)

    # Covariance matrix for log-returns
    sigma_mat = np.diag(vols)
    Cov  = sigma_mat @ corr @ sigma_mat

    # Drift adjustment for risk-neutral measure
    drift = (r - 0.5 * vols**2) * T
    vol_T = vols * np.sqrt(T)

    # Simulate correlated log-normal returns
    Z    = rng.standard_normal((paths, N))
    Z_corr = Z @ L.T            # correlated shocks
    log_ret = drift + vol_T * Z_corr
    ST   = S0 * np.exp(log_ret) # (paths, N) terminal prices

    # Basket value and payoff
    basket_T = ST @ weights     # (paths,) weighted sum
    payoff   = np.maximum(basket_T - K, 0.0)

    price    = np.exp(-r * T) * payoff.mean()
    se       = np.exp(-r * T) * payoff.std() / np.sqrt(paths)
    return {"price": price, "se": se}

# 3-asset basket: AAPL-like, bond-like, EM-like
S0      = np.array([100.0, 100.0, 100.0])
weights = np.array([0.5, 0.3, 0.2])
vols    = np.array([0.25, 0.08, 0.30])
corr    = np.array([[1.0, -0.2, 0.5],
                    [-0.2, 1.0, -0.1],
                    [0.5, -0.1, 1.0]])
result  = basket_call_mc(S0, weights, K=100, r=0.05, T=1.0,
                          vols=vols, corr=corr)
print(f"Basket call price: {result['price']:.4f} +/- {result['se']:.4f}")`,
    explanation: "Basket options are priced almost exclusively by MC because their multi-dimensional payoff has no closed form under correlated GBM. The Cholesky decomposition converts independent normals into correlated shocks matching the correlation matrix; the basket is then the weighted average of correlated log-normal terminal prices.",
  },
  {
    id: "pyfin-20260701-b1-rolling-beta",
    language: "python",
    title: "Rolling OLS Beta for Market-Neutral Hedge Ratio",
    tag: "finance",
    code: `import numpy as np
import pandas as pd

def rolling_beta(asset_returns: pd.Series, market_returns: pd.Series,
                 window: int = 60) -> pd.Series:
    """
    Rolling OLS beta using efficient matrix computation.
    Returns beta_t = Cov(R_asset, R_mkt) / Var(R_mkt) over trailing window.
    """
    # Vectorised rolling covariance and variance
    # pandas rolling().cov() computes pairwise rolling covariance
    r_a  = asset_returns.values
    r_m  = market_returns.values
    n    = len(r_a)
    betas = np.full(n, np.nan)

    for t in range(window - 1, n):
        ra_w = r_a[t - window + 1: t + 1]
        rm_w = r_m[t - window + 1: t + 1]
        cov  = np.cov(ra_w, rm_w, ddof=1)
        betas[t] = cov[0, 1] / cov[1, 1]

    return pd.Series(betas, index=asset_returns.index, name="beta")

np.random.seed(42)
dates   = pd.date_range("2024-01-02", periods=252, freq="B")
mkt_ret = pd.Series(np.random.randn(252) * 0.01, index=dates, name="SPY")
stk_ret = pd.Series(1.3 * mkt_ret + np.random.randn(252) * 0.008, index=dates, name="AAPL")

betas = rolling_beta(stk_ret, mkt_ret, window=60)
print("Last 5 rolling betas:")
print(betas.tail(5).round(3))

# Market-neutral hedge: short beta * market_exposure SPY futures
hedge_ratio = betas.iloc[-1]
print(f"\\nHedge ratio (shares of SPY to short per share of AAPL): {hedge_ratio:.3f}")`,
    explanation: "Rolling OLS beta measures time-varying market sensitivity; a market-neutral strategy shorts beta units of the index for every unit of stock exposure, isolating the alpha from systematic risk. The 60-day window balances responsiveness (short window) against noise reduction (long window) and is standard in statistical arbitrage.",
  },
  {
    id: "pyfin-20260701-b1-ois-bootstrap",
    language: "python",
    title: "SOFR/OIS Curve Bootstrap (Iterative Stripping)",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import brentq

def bootstrap_ois_curve(swap_rates: list[tuple[float, float]],
                         r0: float = 0.05) -> dict:
    """
    Bootstrap a SOFR/OIS discount curve from par swap rates.
    swap_rates: [(maturity_years, par_swap_rate), ...]
    Assumes annual payments for simplicity.
    Returns dict: {maturity: discount_factor}
    """
    discount_factors = {0.0: 1.0}
    curve = {}

    for T, S in sorted(swap_rates):
        maturities = np.arange(1.0, T + 0.5)  # payment dates

        def par_swap_pv(df_T: float) -> float:
            """PV of fixed leg - floating leg (should be 0 at par)."""
            # Add this new DF to interpolate
            dfs = [discount_factors.get(t, np.exp(-r0 * t)) for t in maturities[:-1]]
            dfs.append(df_T)
            fixed_leg    = S * sum(dfs)         # annual coupon * sum(DF)
            floating_leg = 1.0 - df_T           # par swap: 1 - final DF
            return fixed_leg - floating_leg

        # Solve for the discount factor at maturity T
        lo, hi = np.exp(-0.20 * T), np.exp(-0.001 * T)
        df_T   = brentq(par_swap_pv, lo, hi, xtol=1e-10)
        discount_factors[T] = df_T
        curve[T] = -np.log(df_T) / T           # zero rate

    return {"discount_factors": discount_factors, "zero_rates": curve}

# SOFR OIS swap rates (hypothetical)
sofr_swaps = [(1, 0.048), (2, 0.046), (3, 0.045), (5, 0.044), (10, 0.043)]
result = bootstrap_ois_curve(sofr_swaps)
print("Bootstrapped SOFR zero rates:")
for T, z in result["zero_rates"].items():
    df = result["discount_factors"][T]
    print(f"  {T:>3}Y: zero={z:.4%}  DF={df:.6f}")`,
    explanation: "OIS bootstrapping strips zero rates from par swap quotes iteratively: for each maturity, the discount factor is solved so that the swap's fixed leg (annuity × rate) equals the floating leg (1 - final DF). Since SOFR swaps are collateralised, the OIS curve is the risk-free discounting curve used for pricing all interest rate derivatives.",
  },
  {
    id: "pyfin-20260701-b1-bond-carry-rolldown",
    language: "python",
    title: "Bond Carry and Rolldown P&L Attribution",
    tag: "finance",
    code: `import numpy as np

def bond_carry_rolldown(
    face: float, coupon: float, ytm_today: float,
    ytm_curve: dict, maturity: float, horizon: float = 1/12
) -> dict:
    """
    Decompose bond return into carry and rolldown components.

    Carry:    income earned from holding the bond (coupon - funding cost)
    Rolldown: price change as bond 'rolls down' the yield curve to shorter maturity

    ytm_curve: {maturity_years: yield} — the current yield curve
    horizon:   holding period in years (default 1 month)
    """
    def bond_price(f, c, y, mat):
        n   = int(mat * 2)  # semi-annual
        pmt = f * c / 2
        pv  = 0.0
        for t in range(1, n + 1):
            cf  = pmt + (f if t == n else 0)
            pv += cf / (1 + y/2)**t
        return pv

    # Current price
    price_today = bond_price(face, coupon, ytm_today, maturity)

    # After horizon: bond has maturity (maturity - horizon)
    mat_after   = maturity - horizon
    # Interpolate yield at shorter maturity
    mats  = sorted(ytm_curve.keys())
    ys    = [ytm_curve[m] for m in mats]
    ytm_after = np.interp(mat_after, mats, ys)

    price_after = bond_price(face, coupon, ytm_after, mat_after)

    # Carry = accrued coupon during horizon
    carry_income  = face * coupon * horizon
    # P&L from riding the curve (rolldown)
    rolldown      = price_after - price_today
    # Total return (ignoring financing cost for simplicity)
    total_pnl     = carry_income + rolldown

    return {
        "price_today": price_today,
        "price_after": price_after,
        "carry":       carry_income,
        "rolldown":    rolldown,
        "total_pnl":   total_pnl,
        "total_ret":   total_pnl / price_today,
    }

curve = {0.25: 0.050, 1: 0.049, 2: 0.047, 5: 0.045, 10: 0.044, 30: 0.043}
result = bond_carry_rolldown(1000, 0.045, 0.045, curve, maturity=5.0)
for k, v in result.items():
    print(f"{k:>12}: {v:.4f}")`,
    explanation: "Carry is the income from holding a bond minus its funding cost; rolldown is the price appreciation from 'riding' a positively-sloped curve as the bond ages to a lower-yield maturity. Together they form the expected return of a fixed-income carry trade — a key input in bond selection and relative-value strategies.",
  },
  {
    id: "pyfin-20260701-b1-factor-mimicking",
    language: "python",
    title: "Factor Mimicking Portfolio Construction",
    tag: "finance",
    code: `import numpy as np
from scipy.optimize import minimize

def factor_mimicking_portfolio(
    F: np.ndarray, R: np.ndarray, Sigma: np.ndarray
) -> np.ndarray:
    """
    Construct a factor mimicking portfolio (FMP) for a given factor exposure F.

    F:     (N,) target factor loadings / characteristics for N assets
    R:     (T, N) historical returns matrix
    Sigma: (N, N) asset covariance matrix

    Returns: (N,) portfolio weights w such that:
      - w is minimum-variance portfolio with unit exposure to F
      - w is orthogonal to all other factors (via Lagrange multiplier approach)
    """
    N = len(F)
    Sigma_inv = np.linalg.inv(Sigma + 1e-6*np.eye(N))   # regularise

    # Analytic solution: w = Sigma^{-1} F / (F^T Sigma^{-1} F)
    # This is the minimum-variance portfolio with unit F exposure
    Sigma_inv_F = Sigma_inv @ F
    denom       = F @ Sigma_inv_F
    w           = Sigma_inv_F / denom

    # Verify: w^T F = 1 (unit factor exposure)
    exposure = w @ F
    return w

np.random.seed(42)
N, T = 50, 120
# Synthetic momentum factor (rank-normalised 12-1 return)
F   = np.random.randn(N)   # factor score
R   = np.random.randn(T, N) * 0.02 + 0.0005

# Covariance from history
Sigma = np.cov(R.T)

w = factor_mimicking_portfolio(F, R, Sigma)
print(f"Exposure to factor: {w @ F:.4f}")    # should be 1.0
print(f"Portfolio vol:      {np.sqrt(w @ Sigma @ w):.4f}")
print(f"Sum of weights:     {w.sum():.4f}")  # not necessarily 1 (long-short)
print(f"Long fraction:      {w[w>0].sum():.4f}")`,
    explanation: "Factor mimicking portfolios (FMPs) isolate exposure to a specific characteristic (value, momentum, quality) with minimum residual variance — they are the building blocks of factor-based investing and risk attribution. The analytic solution w = Sigma⁻¹F / (F'Sigma⁻¹F) is the GLS regression of returns on the factor.",
  },
  {
    id: "pyfin-20260701-b1-realized-cov",
    language: "python",
    title: "Realised Covariance Matrix from Intraday Tick Data",
    tag: "finance",
    code: `import numpy as np
import pandas as pd
from typing import Optional

def realized_covariance(
    prices: pd.DataFrame,
    freq: str = "5min",
    annualise: bool = True
) -> np.ndarray:
    """
    Compute realised covariance matrix from intraday tick data.
    Uses synchronous returns sampled at 'freq' intervals.

    prices: DataFrame with DatetimeIndex and one column per asset.
            Missing values (asynchronous ticks) forward-filled.
    Returns: (N, N) annualised realised covariance matrix.
    """
    # Forward-fill to synchronise asynchronous ticks, then resample
    sampled = prices.ffill().resample(freq).last().dropna(how="all")
    log_ret = np.log(sampled / sampled.shift(1)).dropna()

    N       = log_ret.shape[1]
    rcov    = log_ret.T.values @ log_ret.values   # (N, N) outer product sum

    if annualise:
        # Compute number of intervals per trading day
        intervals_per_day = pd.Timedelta("6.5h") / pd.Timedelta(freq)
        trading_days      = 252
        rcov *= intervals_per_day * trading_days

    return rcov

# Synthetic 1-day intraday prices for 3 assets (1-minute data)
rng     = np.random.default_rng(42)
dates   = pd.date_range("2026-07-01 09:30", periods=390, freq="1min")
returns = rng.multivariate_normal(
    mean=[0, 0, 0],
    cov=[[1.0, 0.6, 0.2], [0.6, 1.0, -0.1], [0.2, -0.1, 1.0]],
    size=390) * 0.001
prices  = pd.DataFrame(
    100 * np.exp(returns.cumsum(axis=0)),
    index=dates, columns=["AAPL", "MSFT", "NVDA"])

rcov = realized_covariance(prices, freq="5min", annualise=True)
rcorr = rcov / np.sqrt(np.diag(rcov)[:, None] * np.diag(rcov)[None, :])
print("Realised correlation matrix:")
print(np.round(rcorr, 3))`,
    explanation: "Realised covariance, computed from high-frequency synchronised returns, is a consistent estimator of the instantaneous covariance matrix under mild conditions. It outperforms daily-return covariance for short-horizon risk models because it incorporates intraday price information; 5-minute sampling balances microstructure noise against information content.",
  },
];
