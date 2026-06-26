import type { Snippet } from "./types";

export const pythonFinanceSnippets20260626B1: Snippet[] = [
  {
    id: "pyfin-20260626-b1-kalman-pairs",
    language: "python",
    title: "Kalman Filter Pairs Trading (Dynamic Hedge Ratio)",
    tag: "stat arb",
    code: `import numpy as np

class KalmanHedge:
    """
    State vector: [beta, alpha] where SPY = beta*IVV + alpha + eps.
    Both beta and alpha follow independent random walks (time-varying).
    """
    def __init__(self, delta=1e-4, obs_noise=0.01):
        self.Q = delta / (1 - delta) * np.eye(2)  # state transition noise
        self.R = obs_noise                          # observation noise variance
        self.P = np.zeros((2, 2))                  # state covariance
        self.x = np.array([1.0, 0.0])              # initial [beta, alpha]

    def update(self, ivv, spy):
        H = np.array([ivv, 1.0])        # observation row vector
        # Prediction step: state covariance grows by process noise
        P_pred = self.P + self.Q
        # Kalman gain: weight new observation vs prior
        S = H @ P_pred @ H + self.R     # innovation variance
        K = P_pred @ H / S              # (2,) Kalman gain vector
        innov = spy - H @ self.x        # prediction error (spread)
        self.x = self.x + K * innov     # updated state estimate
        self.P = (np.eye(2) - np.outer(K, H)) @ P_pred  # updated covariance
        return innov, np.sqrt(S), self.x.copy()

np.random.seed(42)
n = 600
ivv = np.cumsum(np.random.randn(n) * 0.5) + 200
# True hedge ratio drifts from 0.95 to 1.05 over time
beta_true = np.linspace(0.95, 1.05, n) + np.random.randn(n) * 0.005
spy = beta_true * ivv + 1.5 + np.random.randn(n) * 0.3

kf = KalmanHedge(delta=1e-4, obs_noise=0.09)
spreads, stds, betas = [], [], []
for i, v, s in zip(range(n), ivv, spy):
    sp, sd, b = kf.update(v, s)
    spreads.append(sp); stds.append(sd); betas.append(b[0])

z = np.array(spreads) / np.array(stds)
signals = np.where(z > 2, -1, np.where(z < -2, 1, 0))
print(f"Estimated beta range: {min(betas):.3f} – {max(betas):.3f}")
print(f"True beta range:      {beta_true.min():.3f} – {beta_true.max():.3f}")
print(f"Long entries: {(signals==1).sum()}, Short entries: {(signals==-1).sum()}")`,
    explanation: "Unlike static OLS which estimates a single fixed hedge ratio, the Kalman filter treats the hedge ratio as a hidden state that evolves as a random walk; the innovation variance S provides a time-varying normalizer for the Z-score that automatically accounts for increased uncertainty when the hedge ratio is drifting.",
  },
  {
    id: "pyfin-20260626-b1-hmm-regime",
    language: "python",
    title: "Hidden Markov Model Regime Detection",
    tag: "regime detection",
    code: `import numpy as np
from hmmlearn import hmm

np.random.seed(7)
# Simulate bull (low vol, positive drift) and bear (high vol, negative drift)
bull_rets = np.random.normal(0.0006, 0.007, 700)
bear_rets = np.random.normal(-0.0012, 0.020, 300)
all_rets  = np.concatenate([bull_rets[:400], bear_rets[:200], bull_rets[400:]])
n = len(all_rets)

# Use return + squared return as features (captures level + volatility)
X = np.column_stack([all_rets, all_rets**2])

# Fit Gaussian HMM with 2 hidden states
model = hmm.GaussianHMM(n_components=2, covariance_type="diag",
                         n_iter=300, random_state=0, tol=1e-5)
model.fit(X)

# Viterbi decoding: most likely state sequence
states = model.predict(X)

# Identify which state is bull vs bear by mean return
state_means = [all_rets[states == s].mean() for s in range(2)]
bull_state  = int(np.argmax(state_means))
bear_state  = 1 - bull_state

print("Transition matrix (row=from, col=to):")
print(model.transmat_.round(4))

for s, label in [(bull_state, "Bull"), (bear_state, "Bear")]:
    mask = states == s
    r    = all_rets[mask]
    dur  = 1 / (1 - model.transmat_[s, s])   # expected regime duration
    print(f"{label}: mean={r.mean():.4f}, vol={r.std():.4f}, "
          f"n={mask.sum()}, avg_duration={dur:.1f}d")

# Forward probability for regime forecast
_, posteriors = model.score_samples(X)
print(f"\\nFinal bull probability: {posteriors[-1, bull_state]:.3f}")`,
    explanation: "HMM captures volatility clustering and regime persistence through the transition matrix — a diagonal entry near 0.98 implies regimes last roughly 50 trading days on average, which simple threshold rules on rolling-vol cannot encode; the Viterbi path is globally optimal while greedy thresholding is not.",
  },
  {
    id: "pyfin-20260626-b1-evt-tail",
    language: "python",
    title: "Peaks Over Threshold (POT) Extreme Tail Risk",
    tag: "risk",
    code: `import numpy as np
from scipy.stats import genpareto

np.random.seed(3)
# Simulate fat-tailed daily losses using Student-t
df_sim = 4
pnl    = np.random.standard_t(df=df_sim, size=5000) * 0.012
losses = -pnl   # positive = loss

# Choose threshold at 95th percentile
u       = np.percentile(losses, 95)
excess  = losses[losses > u] - u   # exceedances over threshold
n_total = len(losses)
n_u     = len(excess)

# Fit Generalized Pareto Distribution (Pickands-Balkema-de Haan theorem)
xi, loc, scale = genpareto.fit(excess, floc=0)   # shape, loc fixed at 0, scale
print(f"GPD fit: xi (tail index) = {xi:.4f}, scale = {scale:.6f}")
print(f"Threshold u = {u:.4f}, exceedances = {n_u}/{n_total}")
print(f"Finite moments: mean (xi<1)={xi<1}, variance (xi<0.5)={xi<0.5}")

def pot_var(conf):
    """POT VaR at confidence level conf."""
    return u + (scale / xi) * ((n_total / n_u * (1 - conf))**(-xi) - 1)

def pot_es(conf):
    """POT CVaR/ES above VaR."""
    v = pot_var(conf)
    return (v + scale - xi * u) / (1 - xi)

print("\nExtreme quantile estimates:")
for conf in [0.99, 0.995, 0.999, 0.9999]:
    v = pot_var(conf)
    e = pot_es(conf)
    print(f"  {conf:.4%}  VaR={v:.4f}  ES={e:.4f}")

# Compare with historical (only possible for 99%)
hist_var = np.percentile(losses, 99)
print(f"\nHistorical 99% VaR: {hist_var:.4f}")
print(f"POT       99% VaR:  {pot_var(0.99):.4f}")`,
    explanation: "The Pickands-Balkema-de Haan theorem proves that for any distribution with a regularly varying tail, exceedances above a sufficiently high threshold converge in distribution to a GPD; a positive shape parameter xi indicates a heavy Pareto tail where extreme losses grow polynomially rather than exponentially.",
  },
  {
    id: "pyfin-20260626-b1-fama-french",
    language: "python",
    title: "Fama-French 3-Factor Alpha Regression",
    tag: "factor models",
    code: `import numpy as np
import pandas as pd
import statsmodels.api as sm

np.random.seed(21)
n = 120   # monthly observations (~10 years)

# Simulate Fama-French factor returns (monthly, annualised basis)
mkt  = np.random.normal(0.006, 0.045, n)   # excess market return
smb  = np.random.normal(0.002, 0.020, n)   # Small Minus Big
hml  = np.random.normal(0.003, 0.018, n)   # High Minus Low (value)

# True portfolio: 0.5% monthly alpha, beta_mkt=1.1, smb=0.3, hml=0.1
true_alpha   = 0.005
beta_mkt     = 1.10
beta_smb     = 0.30
beta_hml     = 0.10
rf           = np.random.normal(0.002, 0.001, n)   # risk-free rate
port_ret     = (rf + true_alpha
                + beta_mkt * mkt
                + beta_smb * smb
                + beta_hml * hml
                + np.random.normal(0, 0.008, n))     # idiosyncratic noise
excess_ret   = port_ret - rf

# OLS regression of excess portfolio return on factors
X = sm.add_constant(np.column_stack([mkt, smb, hml]))
model  = sm.OLS(excess_ret, X).fit(cov_type="HAC", cov_kwds={"maxlags": 3})

alpha = model.params[0]
t_alpha = model.tvalues[0]
r2    = model.rsquared

print(f"Jensen's alpha: {alpha*100:.4f}% / month  "
      f"(t={t_alpha:.2f}, {'significant' if abs(t_alpha)>2 else 'not significant'} at 5%)")
print(f"Market beta: {model.params[1]:.3f}  (true={beta_mkt})")
print(f"SMB beta:    {model.params[2]:.3f}  (true={beta_smb})")
print(f"HML beta:    {model.params[3]:.3f}  (true={beta_hml})")
print(f"R-squared:   {r2:.4f}")
print(f"\nAnnualized alpha: {alpha*12*100:.2f}%")
print(model.summary().tables[1])`,
    explanation: "A statistically significant alpha after controlling for MKT, SMB, and HML means the portfolio earns returns not explained by its loadings on these three priced risk factors — this is evidence of genuine skill or an omitted risk premium; HAC standard errors (Newey-West) correct for autocorrelation in monthly return residuals.",
  },
  {
    id: "pyfin-20260626-b1-heston-mc",
    language: "python",
    title: "Heston Stochastic Volatility Monte Carlo",
    tag: "options",
    code: `import numpy as np
from scipy.stats import norm

np.random.seed(0)

# Heston model parameters
S0    = 100.0   # initial spot
K     = 100.0   # strike
T     = 1.0     # maturity
r     = 0.05    # risk-free rate
v0    = 0.04    # initial variance (vol = 20%)
kappa = 2.0     # mean-reversion speed
theta = 0.04    # long-run variance
sigma = 0.3     # vol-of-vol
rho   = -0.7    # correlation spot vs vol (typical negative for equities)

n_paths = 200_000
n_steps = 252
dt      = T / n_steps

# Correlated Brownian motions via Cholesky
W_S = np.random.randn(n_steps, n_paths)
W_v = rho * W_S + np.sqrt(1 - rho**2) * np.random.randn(n_steps, n_paths)

S = np.full(n_paths, S0, dtype=float)
v = np.full(n_paths, v0, dtype=float)

for i in range(n_steps):
    v_pos = np.maximum(v, 0)           # full truncation to keep v non-negative
    dv    = (kappa * (theta - v_pos) * dt
             + sigma * np.sqrt(v_pos * dt) * W_v[i])
    dS    = S * (r * dt + np.sqrt(v_pos * dt) * W_S[i])
    v     = v_pos + dv
    S     = S + dS

# European call payoff
payoff = np.maximum(S - K, 0)
price_heston = np.exp(-r * T) * payoff.mean()
se_heston    = np.exp(-r * T) * payoff.std() / np.sqrt(n_paths)

# Black-Scholes benchmark at ATM implied vol = sqrt(theta)
bs_sigma = np.sqrt(theta)
d1 = (np.log(S0/K) + (r + 0.5*bs_sigma**2)*T) / (bs_sigma*np.sqrt(T))
d2 = d1 - bs_sigma*np.sqrt(T)
price_bs = S0*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

print(f"Heston call price: {price_heston:.4f} ± {1.96*se_heston:.4f}")
print(f"Black-Scholes:     {price_bs:.4f}")
print(f"Heston premium over BS: {price_heston - price_bs:.4f} (from vol smile)")`,
    explanation: "Heston's stochastic volatility generates a volatility smile because the vol-of-vol sigma creates fat tails and the negative rho skews the distribution left, making OTM puts more expensive than BS predicts; full truncation (max(v,0)) is simpler than reflection but introduces slight bias, fixed by Broadie-Kaya exact simulation.",
  },
  {
    id: "pyfin-20260626-b1-sabr-calib",
    language: "python",
    title: "SABR Model Calibration to Implied Vol Smile",
    tag: "options",
    code: `import numpy as np
from scipy.optimize import minimize

def sabr_implied_vol(F, K, T, alpha, beta, rho, nu):
    """Hagan 2002 SABR lognormal vol approximation."""
    eps = 1e-10
    FK_b = (F * K) ** ((1 - beta) / 2)
    logFK = np.log(F / K)
    if abs(logFK) < eps:
        # ATM formula (L'Hopital limit)
        A = alpha / (FK_b * (1 + ((1-beta)**2/24)*logFK**2))
        B = 1 + T * (((1-beta)**2/24) * alpha**2 / FK_b**2
                     + rho*beta*nu*alpha/(4*FK_b)
                     + (2 - 3*rho**2)/24 * nu**2)
        return A * B

    z  = (nu / alpha) * FK_b * logFK
    chi = np.log((np.sqrt(1 - 2*rho*z + z**2) + z - rho) / (1 - rho))
    zx = z / chi if abs(chi) > eps else 1.0

    A = alpha / (FK_b * (1 + ((1-beta)**2/24)*logFK**2
                          + ((1-beta)**4/1920)*logFK**4))
    B = 1 + T * (((1-beta)**2/24) * alpha**2 / FK_b**2
                  + rho*beta*nu*alpha/(4*FK_b)
                  + (2 - 3*rho**2)/24 * nu**2)
    return A * zx * B

# Market implied vols across strikes for F=100, T=1y
F, T_mat, beta = 100.0, 1.0, 0.5   # beta fixed by convention
strikes     = np.array([75, 85, 90, 95, 100, 105, 110, 115, 125], dtype=float)
# True params: alpha=0.25, rho=-0.35, nu=0.45
true = (0.25, -0.35, 0.45)
mkt_vols = np.array([sabr_implied_vol(F, k, T_mat, *true, beta=0.5)
                     if False else  # inline call:
                     sabr_implied_vol(F, k, T_mat, true[0], beta, true[1], true[2])
                     for k in strikes])

def objective(params):
    a, r, n = params
    if not (-0.999 < r < 0.999) or a <= 0.001 or n <= 0.001:
        return 1e10
    fitted = np.array([sabr_implied_vol(F, k, T_mat, a, beta, r, n) for k in strikes])
    return np.sum((fitted - mkt_vols)**2) * 1e6  # scale for numerical stability

res = minimize(objective, [0.20, -0.25, 0.50], method="Nelder-Mead",
               options={"xatol": 1e-9, "fatol": 1e-12, "maxiter": 10000})
a_fit, r_fit, n_fit = res.x
print(f"Calibrated: alpha={a_fit:.4f}, rho={r_fit:.4f}, nu={n_fit:.4f}")
print(f"True:       alpha={true[0]:.4f}, rho={true[1]:.4f}, nu={true[2]:.4f}")
for k, mv in zip(strikes, mkt_vols):
    fv = sabr_implied_vol(F, k, T_mat, a_fit, beta, r_fit, n_fit)
    print(f"  K={k:5.0f}  mkt={mv:.4f}  fit={fv:.4f}  err={1e4*(fv-mv):.2f}bp")`,
    explanation: "SABR's analytical smile formula enables instant calibration (no PDE solve) — the three free parameters alpha (level), rho (skew), and nu (smile convexity) directly correspond to the three main shape features of observed market smiles; fixing beta at 0.5 is standard for equity indices and reduces the optimization to 3D.",
  },
  {
    id: "pyfin-20260626-b1-cds-hazard",
    language: "python",
    title: "CDS Hazard Rate Bootstrapping",
    tag: "credit",
    code: `import numpy as np
from scipy.optimize import brentq

def bootstrap_hazard_rates(tenors, par_spreads, recovery=0.40, r=0.05, dt=0.25):
    """
    Bootstrap piecewise-constant hazard rates from CDS par spreads.
    At each maturity T_k, solve for lambda_k so that:
      S_k * PV01(lambda_1..k) = ProtectionLeg(lambda_1..k)
    using hazard rates fixed from shorter maturities.
    """
    hazards = []     # piecewise-constant lambda per interval
    seg_ends = []    # tenor breakpoints

    for k_idx, (T, S) in enumerate(zip(tenors, par_spreads)):
        def cds_pv(h_k):
            hs       = hazards + [h_k]
            seg_e    = seg_ends + [T]
            pv01     = 0.0
            prot     = 0.0
            t        = 0.0
            q        = 1.0   # survival probability at t=0
            while t < T - 1e-9:
                t1  = min(t + dt, T)
                # Identify which segment this interval falls in
                seg = next(i for i, te in enumerate(seg_e) if te >= t1 - 1e-9)
                h   = hs[seg]
                tau = t1 - t
                q1  = q * np.exp(-h * tau)
                df  = np.exp(-r * t1)
                # Protection leg: (1-R) * P(default in [t, t1]) * df
                prot  += (1 - recovery) * (q - q1) * df
                # Premium leg: S * tau * avg survival * df
                pv01  += tau * df * (q + q1) / 2
                q  = q1
                t  = t1
            return S * pv01 - prot   # par condition: PV = 0

        h_k = brentq(cds_pv, 1e-6, 5.0, xtol=1e-10)
        hazards.append(h_k)
        seg_ends.append(T)

    return hazards

tenors      = [1, 3, 5, 7, 10]
par_spreads = [0.005, 0.010, 0.014, 0.017, 0.020]   # 50bps, 100bps, ...

hazards = bootstrap_hazard_rates(tenors, par_spreads)
print(f"{'Tenor':>6} {'Spread (bps)':>14} {'Lambda':>10} {'P(surv)':>10}")
for t, s, h in zip(tenors, par_spreads, hazards):
    surv = np.exp(-h * t)
    print(f"{t:>6}y {s*10000:>13.1f}  {h:>10.4f}  {surv:>10.4f}")`,
    explanation: "The hazard rate lambda satisfies P(default > t) = exp(-∫₀ᵗ λ(s) ds), so piecewise-constant lambda between tenor breakpoints gives an exponential survival curve; sequential bootstrapping works because each new tenor's CDS has zero NPV at par, uniquely determining the next hazard rate given all previous ones.",
  },
  {
    id: "pyfin-20260626-b1-control-variates",
    language: "python",
    title: "Control Variates Variance Reduction (Asian Option)",
    tag: "options",
    code: `import numpy as np
from scipy.stats import norm

np.random.seed(42)

# Black-Scholes parameters
S0    = 100.0
K     = 100.0
T     = 1.0
r     = 0.05
sigma = 0.20
n_steps = 252
n_paths = 50_000

dt   = T / n_steps
disc = np.exp(-r * T)

# Simulate GBM paths
Z    = np.random.randn(n_paths, n_steps)
dW   = np.sqrt(dt) * Z
log_increments = (r - 0.5 * sigma**2) * dt + sigma * dW
log_S  = np.log(S0) + np.cumsum(log_increments, axis=1)
S_path = np.exp(log_S)   # shape (n_paths, n_steps)

# Arithmetic average (target) and geometric average (control)
arith_avg = S_path.mean(axis=1)
geom_avg  = np.exp(np.log(S_path).mean(axis=1))

# Arithmetic Asian call payoff (Y) — no closed form
Y = disc * np.maximum(arith_avg - K, 0)

# Geometric Asian call payoff (X) — HAS closed form (Kemna-Vorst)
X = disc * np.maximum(geom_avg - K, 0)

# Closed-form geometric Asian price (Kemna-Vorst)
sigma_g = sigma * np.sqrt((n_steps + 1) * (2*n_steps + 1) / (6 * n_steps**2))
b_g     = 0.5 * (r - 0.5 * sigma**2 + sigma_g**2)
d1_g    = (np.log(S0/K) + (b_g + 0.5*sigma_g**2)*T) / (sigma_g*np.sqrt(T))
d2_g    = d1_g - sigma_g * np.sqrt(T)
E_X     = disc * (S0 * np.exp(b_g*T) * norm.cdf(d1_g) - K * norm.cdf(d2_g))

# Control variate estimator: E[Y] ≈ Y_bar - c*(X_bar - E[X])
c_opt = np.cov(Y, X)[0, 1] / np.var(X)    # optimal control coefficient
Y_cv  = Y - c_opt * (X - E_X)

naive_mean, naive_std  = Y.mean(),    Y.std() / np.sqrt(n_paths)
cv_mean,    cv_std     = Y_cv.mean(), Y_cv.std() / np.sqrt(n_paths)
variance_reduction = (naive_std / cv_std) ** 2

print(f"Naive MC:        price={naive_mean:.4f}  SE={naive_std:.6f}")
print(f"Control variate: price={cv_mean:.4f}  SE={cv_std:.6f}")
print(f"Variance reduction factor: {variance_reduction:.1f}x")
print(f"Optimal c = {c_opt:.4f}")`,
    explanation: "The control variate estimator E[Y] ≈ Ȳ - c*(X̄ - E[X]) with c = Cov(Y,X)/Var(X) is unbiased and achieves a variance reduction of 1/(1-ρ²) where ρ is the correlation between Y and X; arithmetic and geometric Asian payoffs are highly correlated (~0.99), yielding ~50-100x variance reduction.",
  },
  {
    id: "pyfin-20260626-b1-kelly",
    language: "python",
    title: "Kelly Criterion and Fractional Kelly Sizing",
    tag: "portfolio",
    code: `import numpy as np
from scipy.optimize import minimize

# --- Single-asset Kelly ---
def kelly_single(p_win, b):
    """
    Kelly fraction for a bet: win b units with probability p, lose 1 unit with (1-p).
    f* = (p*b - (1-p)) / b = edge / odds
    """
    edge = p_win * b - (1 - p_win)
    return edge / b

p, b = 0.55, 1.0   # 55% win probability, 1:1 odds (like a biased coin)
f_kelly  = kelly_single(p, b)
f_half   = 0.5 * f_kelly
f_quarter= 0.25 * f_kelly
print(f"Full Kelly: {f_kelly:.4f} ({f_kelly*100:.2f}% of bankroll)")
print(f"Half Kelly: {f_half:.4f}  Quarter Kelly: {f_quarter:.4f}")

# Expected geometric growth rate g(f) = E[log(1 + f*R)]
def geo_growth(f, p_win, b):
    return p_win * np.log(1 + f * b) + (1 - p_win) * np.log(1 - f)

fs = np.linspace(0.001, 0.99, 1000)
gs = [geo_growth(f, p, b) for f in fs]
f_opt_idx = np.argmax(gs)
print(f"\nNumerical max: f*={fs[f_opt_idx]:.4f}, g={gs[f_opt_idx]:.6f}")
print(f"Analytic Kelly: {f_kelly:.4f}")

# --- Multi-asset Kelly (covariance matrix) ---
np.random.seed(5)
n = 4
mu     = np.array([0.12, 0.08, 0.10, 0.06])  # expected excess returns
Sigma  = np.array([[0.04,0.01,0.02,0.00],
                   [0.01,0.02,0.01,0.00],
                   [0.02,0.01,0.05,0.01],
                   [0.00,0.00,0.01,0.01]])
# Multi-asset Kelly: f* = Sigma^{-1} * mu
f_multi = np.linalg.solve(Sigma, mu)
print(f"\nMulti-asset Kelly fractions: {f_multi.round(3)}")
print(f"Total leverage: {f_multi.sum():.2f}x")
print("Practical (quarter Kelly):", (0.25 * f_multi).round(3))`,
    explanation: "Full Kelly maximizes the long-run geometric growth rate but leads to very high volatility and frequent large drawdowns — in practice a fractional Kelly (0.25-0.5) is used to reduce variance at the cost of slightly slower compounding; multi-asset Kelly solves for optimal sizing simultaneously using the inverse covariance matrix, equivalent to mean-variance optimization with a specific risk aversion.",
  },
  {
    id: "pyfin-20260626-b1-hull-white",
    language: "python",
    title: "Hull-White Short-Rate Model Monte Carlo",
    tag: "fixed income",
    code: `import numpy as np
from scipy.optimize import minimize

np.random.seed(8)

# Nelson-Siegel yield curve for calibration target
def ns_yield(t, b0=0.04, b1=-0.015, b2=0.025, tau=2.5):
    """Nelson-Siegel instantaneous forward approximation."""
    e = np.exp(-t / tau)
    return b0 + b1 * e + b2 * (t / tau) * e

def hw_theta(t, a, sigma, ns_fn):
    """
    Hull-White mean-reversion level theta(t) fitted to initial curve.
    theta(t) = df/dt + a*f(t) + sigma^2/(2a) * (1 - exp(-2a*t))
    where f(t) is the instantaneous forward rate.
    """
    h = 1e-5
    f    = ns_fn(t)
    dfdt = (ns_fn(t + h) - ns_fn(t - h)) / (2 * h)
    return dfdt + a * f + (sigma**2 / (2 * a)) * (1 - np.exp(-2 * a * t))

# Hull-White parameters
a     = 0.15    # mean-reversion speed
sigma = 0.01    # short-rate volatility
r0    = ns_yield(0.01)   # initial short rate

# Monte Carlo simulation
T       = 5.0
n_steps = 252 * int(T)
n_paths = 20_000
dt      = T / n_steps
t_grid  = np.linspace(dt, T, n_steps)

paths = np.zeros((n_paths, n_steps + 1))
paths[:, 0] = r0
W = np.random.randn(n_paths, n_steps)

for i, t in enumerate(t_grid):
    theta_t = hw_theta(t, a, sigma, ns_yield)
    r_prev  = paths[:, i]
    dr      = a * (theta_t - r_prev) * dt + sigma * np.sqrt(dt) * W[:, i]
    paths[:, i + 1] = r_prev + dr

# Price zero-coupon bond B(0,T) = E[exp(-integral_0^T r(t) dt)]
r_integral = paths[:, 1:].mean(axis=1) * T   # trapezoid approx
zcb_mc     = np.exp(-r_integral).mean()

# Analytical ZCB for comparison (known exact formula for HW)
zcb_ns = np.exp(-ns_yield(T) * T)
print(f"MC ZCB price B(0,{T:.0f}): {zcb_mc:.6f}")
print(f"NS target  B(0,{T:.0f}): {zcb_ns:.6f}")
print(f"MC yield: {-np.log(zcb_mc)/T:.4%}  NS yield: {ns_yield(T):.4%}")`,
    explanation: "Hull-White's time-varying mean-reversion level theta(t) is analytically determined from the initial yield curve's forward rates and slope, guaranteeing exact fit to all observed term structure prices — unlike constant-theta Vasicek which can only match one maturity; this makes HW the standard model for interest rate derivatives desks.",
  },
  {
    id: "pyfin-20260626-b1-backtest-costs",
    language: "python",
    title: "Vectorized Backtest Engine with Transaction Costs",
    tag: "execution",
    code: `import numpy as np
import pandas as pd

np.random.seed(12)
n_days  = 504   # 2 years
n_assets = 5

# Simulate daily returns and a simple momentum signal
returns = pd.DataFrame(
    np.random.randn(n_days, n_assets) * 0.012 + 0.0003,
    columns=[f"A{i}" for i in range(n_assets)]
)
# Signal: 20-day momentum z-score
signal = returns.rolling(20).mean() / returns.rolling(20).std()
signal = signal.fillna(0).clip(-3, 3)
signal_norm = signal.div(signal.abs().sum(axis=1).replace(0, 1), axis=0)

# Target weights (long-short, dollar-neutral per row)
target_w = signal_norm * 0.5   # max 50% gross exposure

# Cost model: fixed spread + sqrt-impact (Almgren-Chriss)
adv      = 1_000_000           # average daily volume per asset
notional = 1_000_000           # portfolio notional
bps_fixed = 5e-4               # 5 bps one-way spread cost
eta       = 0.10               # market-impact coefficient

def transaction_cost(delta_w):
    """delta_w: change in fractional position."""
    trade_size = np.abs(delta_w) * notional
    fixed_cost = bps_fixed * trade_size
    # Sqrt impact: eta * sigma_daily * sqrt(trade / ADV) * notional
    sigma_daily = 0.012
    impact_cost = eta * sigma_daily * np.sqrt(trade_size / adv) * notional
    return (fixed_cost + impact_cost) / notional   # as fraction

pnl  = pd.Series(0.0, index=returns.index)
prev_w = pd.Series(0.0, index=returns.columns)
costs = []

for t in range(20, n_days):
    curr_w = target_w.iloc[t]
    delta_w = curr_w - prev_w
    cost    = transaction_cost(delta_w).sum()
    gross_pnl = (prev_w * returns.iloc[t]).sum()
    pnl.iloc[t] = gross_pnl - cost
    costs.append(cost)
    prev_w = curr_w

# Performance metrics
ann_ret    = pnl.mean() * 252
ann_vol    = pnl.std() * np.sqrt(252)
sharpe     = ann_ret / ann_vol
cum_pnl    = pnl.cumsum()
drawdown   = cum_pnl - cum_pnl.cummax()
max_dd     = drawdown.min()
turnover   = pd.Series(costs).mean() / bps_fixed   # avg daily turnover

print(f"Ann. return:  {ann_ret:.2%}")
print(f"Ann. vol:     {ann_vol:.2%}")
print(f"Sharpe ratio: {sharpe:.2f}")
print(f"Max drawdown: {max_dd:.4f}")
print(f"Avg daily cost (bps): {pd.Series(costs).mean()*1e4:.2f}")`,
    explanation: "Market impact scales as sqrt(trade_size / ADV) per the Almgren-Chriss model, so a 10x larger trade costs only ~3.2x more per share — but the portfolio turnover compounds these costs daily; the vectorized design separates signal generation from cost modeling, making it easy to stress-test different cost assumptions without rerunning the signal.",
  },
  {
    id: "pyfin-20260626-b1-importance-sampling",
    language: "python",
    title: "Importance Sampling for Deep OTM Option Pricing",
    tag: "options",
    code: `import numpy as np
from scipy.stats import norm
from scipy.optimize import minimize_scalar

np.random.seed(0)

# Black-Scholes parameters for 5-sigma OTM call
S0    = 100.0
K     = 160.0   # deep OTM: log(K/S0)/(sigma*sqrt(T)) ≈ 5 sigmas
T     = 1.0
r     = 0.05
sigma = 0.20
n_paths = 100_000
disc  = np.exp(-r * T)

# Log-normal terminal: log(S_T) ~ N(mu_log, sigma^2 * T)
mu_log  = np.log(S0) + (r - 0.5 * sigma**2) * T
vol_log = sigma * np.sqrt(T)
d_otm   = (np.log(K/S0) - (r - 0.5*sigma**2)*T) / vol_log
print(f"OTM moneyness: {d_otm:.2f} standard deviations")

# --- Naive MC ---
Z_naive = np.random.randn(n_paths)
S_T_naive = np.exp(mu_log + vol_log * Z_naive)
payoff_naive = disc * np.maximum(S_T_naive - K, 0)
price_naive  = payoff_naive.mean()
se_naive     = payoff_naive.std() / np.sqrt(n_paths)

# --- Importance Sampling: shift mean toward the money ---
# Optimal lambda: mu_log + lambda*vol_log^2 = log(K) => lambda = (log(K)-mu_log)/vol_log^2
lam_opt = (np.log(K) - mu_log) / vol_log**2
mu_is   = mu_log + lam_opt * vol_log**2   # shifted mean (in log space)

Z_is    = np.random.randn(n_paths)
S_T_is  = np.exp(mu_is + vol_log * Z_is)   # sample under tilted measure
payoff_is_raw = disc * np.maximum(S_T_is - K, 0)
# Radon-Nikodym derivative: correct back to original measure
logRN   = -lam_opt * (S_T_is - np.exp(mu_is)) / S_T_is  # simplified for lognormal
RN      = np.exp(-(lam_opt * vol_log * Z_is) + 0.5 * lam_opt**2 * vol_log**2)
payoff_is_cv = payoff_is_raw / RN

price_is = payoff_is_cv.mean()
se_is    = payoff_is_cv.std() / np.sqrt(n_paths)

# Analytical BS price
d1 = (np.log(S0/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
d2 = d1 - sigma*np.sqrt(T)
price_bs = S0*norm.cdf(d1) - K*disc*norm.cdf(d2)

print(f"Black-Scholes:  {price_bs:.8f}")
print(f"Naive MC:       {price_naive:.8f}  SE={se_naive:.2e}")
print(f"IS MC:          {price_is:.8f}  SE={se_is:.2e}")
print(f"Variance reduction: {(se_naive/se_is)**2:.0f}x")`,
    explanation: "Exponential tilting shifts the sampling distribution toward the rare region of interest; the Radon-Nikodym derivative reweights each sample to maintain an unbiased estimator; the optimal lambda minimizes variance by centering the IS distribution exactly on the strike, achieving 100-1000x variance reduction for events multiple standard deviations away.",
  },
  {
    id: "pyfin-20260626-b1-yield-pca",
    language: "python",
    title: "Yield Curve PCA: Level, Slope, Curvature",
    tag: "fixed income",
    code: `import numpy as np

np.random.seed(2)

# 10 maturities: 3m, 6m, 1y, 2y, 3y, 5y, 7y, 10y, 20y, 30y
maturities = np.array([0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30])
n_maturities = len(maturities)
n_weeks   = 260   # 5 years of weekly data

# Simulate yield curve with 3-factor structure + noise
# Factor 1: level (parallel shift), Factor 2: slope, Factor 3: curvature
def nelson_siegel_loadings(t, tau=2.5):
    e = np.exp(-t / tau)
    return np.column_stack([
        np.ones_like(t),             # level
        (1 - e) / (t / tau),         # slope
        (1 - e) / (t / tau) - e,     # curvature
    ])

L = nelson_siegel_loadings(maturities)   # (10, 3) factor loadings

# Weekly factor shocks
factor_cov = np.diag([0.02**2, 0.015**2, 0.008**2])
factor_changes = np.random.multivariate_normal([0, 0, 0], factor_cov, n_weeks)
yield_changes  = factor_changes @ L.T + np.random.randn(n_weeks, n_maturities) * 0.001

# PCA on weekly yield changes
cov_matrix = np.cov(yield_changes.T)   # (10, 10)
eigenvalues, eigenvectors = np.linalg.eigh(cov_matrix)

# Sort descending
idx = np.argsort(eigenvalues)[::-1]
eigenvalues  = eigenvalues[idx]
eigenvectors = eigenvectors[:, idx]

# Variance explained
var_explained = eigenvalues / eigenvalues.sum()
cum_var       = np.cumsum(var_explained)

print("PC  Var Explained  Cumulative")
for i in range(5):
    print(f"PC{i+1}   {var_explained[i]:.4f}         {cum_var[i]:.4f}")

print(f"\nPC1 (level) loadings:     {eigenvectors[:, 0].round(3)}")
print(f"PC2 (slope) loadings:     {eigenvectors[:, 1].round(3)}")
print(f"PC3 (curvature) loadings: {eigenvectors[:, 2].round(3)}")

# Factor scores (projections)
factor_scores = yield_changes @ eigenvectors[:, :3]
print(f"\nPC1 daily vol: {factor_scores[:, 0].std():.4f}")
print(f"PC2 daily vol: {factor_scores[:, 1].std():.4f}")
print(f"PC3 daily vol: {factor_scores[:, 2].std():.4f}")`,
    explanation: "Yield curve PCA consistently shows that PC1 (parallel shift) explains ~90% of daily variance, PC2 (slope/twist) ~7%, and PC3 (curvature/butterfly) ~2%; this means a yield curve hedge needs only three liquid instruments (e.g. 2y, 5y, 10y futures) to eliminate over 99% of rate risk, which is why DV01 hedging is supplemented by slope and convexity hedges on trading desks.",
  },
  {
    id: "pyfin-20260626-b1-euler-risk",
    language: "python",
    title: "Euler Risk Decomposition for Multi-Asset Portfolio",
    tag: "risk",
    code: `import numpy as np

np.random.seed(99)
n = 6
assets = ["US Eq", "EU Eq", "EM Eq", "HY Bond", "IG Bond", "Gold"]

# Annual vols and correlation matrix
vols = np.array([0.18, 0.20, 0.28, 0.12, 0.06, 0.16])
corr = np.array([
    [1.00, 0.85, 0.75, 0.60, 0.20, -0.10],
    [0.85, 1.00, 0.72, 0.55, 0.15, -0.15],
    [0.75, 0.72, 1.00, 0.60, 0.10, -0.05],
    [0.60, 0.55, 0.60, 1.00, 0.40, -0.20],
    [0.20, 0.15, 0.10, 0.40, 1.00,  0.05],
    [-0.10,-0.15,-0.05,-0.20, 0.05,  1.00],
])
Sigma = np.outer(vols, vols) * corr

# Portfolio weights
w = np.array([0.30, 0.15, 0.10, 0.15, 0.20, 0.10])
assert abs(w.sum() - 1.0) < 1e-10, "Weights must sum to 1"

# Portfolio volatility
port_var = w @ Sigma @ w
port_vol = np.sqrt(port_var)

# Euler decomposition: MRC_i = w_i * (Sigma @ w)_i / port_vol
# By Euler's theorem for homogeneous-degree-1 functions: sum(MRC) = port_vol
marginal_cov = Sigma @ w              # (Sigma*w)_i = dVar/dw_i * 0.5 ... actually dVol/dw_i = (Sigma@w)_i/port_vol
mrc = w * marginal_cov / port_vol    # marginal risk contribution per asset
prc = mrc / port_vol                  # percentage risk contribution

print(f"Portfolio volatility: {port_vol:.4%}")
print(f"\n{'Asset':>8} {'Weight':>8} {'MRC':>10} {'%Risk':>8}")
for a, wi, m, p in zip(assets, w, mrc, prc):
    print(f"{a:>8} {wi:>8.2%} {m:>10.4%} {p:>8.2%}")

print(f"\nSum of MRCs: {mrc.sum():.6f} (should equal {port_vol:.6f})")

# Diversification ratio
weighted_vol = w @ vols    # weighted sum of individual vols
div_ratio    = weighted_vol / port_vol
print(f"Diversification ratio: {div_ratio:.3f}x")
print(f"Diversification benefit: {(1 - 1/div_ratio)*100:.1f}% vol reduction")`,
    explanation: "Euler's theorem guarantees that for homogeneous degree-1 risk measures (like portfolio volatility), marginal risk contributions sum exactly to total risk — enabling exact decomposition with no residual; a high percentage contribution from one asset (e.g. 40%+ in equities) reveals a concentrated risk budget despite appearing diversified by weight.",
  },
  {
    id: "pyfin-20260626-b1-bump-greeks",
    language: "python",
    title: "Bump-and-Reprice Greeks via Finite Differences",
    tag: "options",
    code: `import numpy as np
from scipy.stats import norm

def bs_call(S, K, T, r, sigma):
    """Black-Scholes call price with safe guard for near-zero vol/T."""
    if sigma < 1e-8 or T < 1e-8:
        return max(S - K * np.exp(-r * T), 0.0)
    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    return S * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)

def mc_call(S, K, T, r, sigma, n_paths=100_000, seed=0):
    """MC call pricer — seed MUST be fixed for bump Greeks."""
    rng = np.random.default_rng(seed)
    Z   = rng.standard_normal(n_paths)   # common random numbers
    S_T = S * np.exp((r - 0.5*sigma**2)*T + sigma*np.sqrt(T)*Z)
    disc = np.exp(-r * T)
    return disc * np.maximum(S_T - K, 0).mean()

# Reference parameters
S0, K, T, r, sigma = 100.0, 100.0, 1.0, 0.05, 0.20

h_S   = S0 * 0.01    # 1% spot bump
h_sig = 0.001        # 1 vol point bump
h_T   = 1/252        # 1 day time decay
h_r   = 0.0001       # 1 basis point rate bump

pricer = bs_call   # swap for mc_call to see MC Greeks

# Delta: centered finite difference dC/dS
delta_fd = (pricer(S0+h_S, K, T, r, sigma) - pricer(S0-h_S, K, T, r, sigma)) / (2*h_S)

# Gamma: second-order centered dC^2/dS^2
gamma_fd = (pricer(S0+h_S, K, T, r, sigma)
            - 2*pricer(S0, K, T, r, sigma)
            + pricer(S0-h_S, K, T, r, sigma)) / h_S**2

# Vega: dC/d(sigma), centered
vega_fd  = (pricer(S0, K, T, r, sigma+h_sig) - pricer(S0, K, T, r, sigma-h_sig)) / (2*h_sig)

# Theta: forward difference -dC/dT (note sign for passage of time)
theta_fd = -(pricer(S0, K, T-h_T, r, sigma) - pricer(S0, K, T, r, sigma)) / h_T / 365

# Rho: dC/dr
rho_fd   = (pricer(S0, K, T, r+h_r, sigma) - pricer(S0, K, T, r-h_r, sigma)) / (2*h_r)

print("Bump-and-reprice Greeks (BS analytical):")
print(f"  Delta: {delta_fd:.6f}")
print(f"  Gamma: {gamma_fd:.6f}")
print(f"  Vega:  {vega_fd:.6f}  (per 1% vol move: {vega_fd*0.01:.4f})")
print(f"  Theta: {theta_fd:.6f}  (per calendar day)")
print(f"  Rho:   {rho_fd:.6f}  (per 1bp: {rho_fd*0.0001:.6f})")`,
    explanation: "Bump-and-reprice generalizes to any derivative model that lacks analytical Greeks; when applied to a Monte Carlo pricer, the same random seed (common random numbers) must be reused for bumped and base runs — without this, noise dominates the finite difference and the gamma estimate is unreliable.",
  },
  {
    id: "pyfin-20260626-b1-max-drawdown",
    language: "python",
    title: "Maximum Drawdown and Calmar Ratio Analysis",
    tag: "risk",
    code: `import numpy as np
import pandas as pd

np.random.seed(17)
n_days = 756   # 3 years
# Simulate a strategy with drift and occasional large drawdowns
daily_rets = np.random.randn(n_days) * 0.009 + 0.0004
# Inject a crash period
daily_rets[180:220] -= 0.012   # sustained drawdown phase
daily_rets[500:520] -= 0.015

dates = pd.date_range("2023-01-01", periods=n_days, freq="B")
rets  = pd.Series(daily_rets, index=dates)
cum_ret = (1 + rets).cumprod()

# Running peak (high-water mark)
peak     = cum_ret.cummax()
underwater = cum_ret / peak - 1.0   # drawdown series (<=0)

max_dd_val  = underwater.min()
max_dd_end  = underwater.idxmin()
max_dd_start = cum_ret[:max_dd_end].idxmax()

# Recovery date: first day after trough where we exceed peak again
recovery_series = cum_ret[max_dd_end:][cum_ret[max_dd_end:] >= peak[max_dd_end]]
recovery_date   = recovery_series.index[0] if len(recovery_series) > 0 else None

dd_duration = (max_dd_end - max_dd_start).days
rec_duration = (recovery_date - max_dd_end).days if recovery_date else None

# Performance metrics
ann_return  = rets.mean() * 252
ann_vol     = rets.std() * np.sqrt(252)
sharpe      = ann_return / ann_vol
calmar      = ann_return / abs(max_dd_val)    # Calmar ratio

# Average drawdown (only underwater periods)
avg_dd = underwater[underwater < -0.005].mean()

print(f"Annualized return:  {ann_return:.2%}")
print(f"Annualized vol:     {ann_vol:.2%}")
print(f"Sharpe ratio:       {sharpe:.2f}")
print(f"Calmar ratio:       {calmar:.2f}")
print(f"\nMax drawdown:       {max_dd_val:.2%}")
print(f"  Start:            {max_dd_start.date()}")
print(f"  Trough:           {max_dd_end.date()}  ({dd_duration} days)")
print(f"  Recovery:         {recovery_date.date() if recovery_date else 'N/A'}"
      + (f"  ({rec_duration} days)" if rec_duration else ""))
print(f"Average drawdown:   {avg_dd:.2%}")`,
    explanation: "Calmar penalizes strategies with deep drawdowns that take long to recover, making it more relevant than Sharpe for investors who face margin calls or redemptions during drawdowns; a Calmar above 1.0 means the strategy earns more annually than its worst loss — a practical benchmark for institutional mandates.",
  },
  {
    id: "pyfin-20260626-b1-engle-granger",
    language: "python",
    title: "Engle-Granger Cointegration Test for Pairs Selection",
    tag: "stat arb",
    code: `import numpy as np
import pandas as pd
from statsmodels.tsa.stattools import adfuller
import statsmodels.api as sm

np.random.seed(42)
n_obs   = 500
n_pairs = 20

def simulate_pair(cointegrated=True, half_life=20, noise=1.0):
    """Simulate price pair, optionally cointegrated."""
    x = np.cumsum(np.random.randn(n_obs)) * 2 + 100
    if cointegrated:
        # Cointegrating residual: AR(1) mean-reverting
        phi = np.exp(-np.log(2) / half_life)
        u   = np.zeros(n_obs)
        for t in range(1, n_obs):
            u[t] = phi * u[t-1] + np.random.randn() * noise
        y = 0.8 * x + 5 + u
    else:
        y = np.cumsum(np.random.randn(n_obs)) * 2 + 100  # independent RW
    return x, y

def engle_granger_test(x, y, signif=0.05):
    """Two-step EG: OLS on levels, ADF on residuals."""
    X = sm.add_constant(x)
    ols  = sm.OLS(y, X).fit()
    resid = ols.resid
    adf  = adfuller(resid, maxlags=5, autolag="AIC")
    pval = adf[1]
    coint = pval < signif

    # Half-life from AR(1) fit on residuals
    resid_lag = resid[:-1]
    resid_diff = np.diff(resid)
    rho = np.polyfit(resid_lag, resid_diff, 1)[0]   # rho = phi - 1
    half_life = -np.log(2) / rho if rho < 0 else np.inf

    return coint, pval, ols.params[1], half_life

results = []
for i in range(n_pairs):
    coint_flag = (i < 10)   # first 10 pairs are cointegrated
    x, y = simulate_pair(cointegrated=coint_flag, half_life=15 + i)
    is_coint, pval, beta, hl = engle_granger_test(x, y)
    results.append({
        "pair": i, "true_coint": coint_flag, "detected": is_coint,
        "p_val": pval, "beta": beta, "half_life": hl
    })

df = pd.DataFrame(results)
detected_correctly = (df["true_coint"] == df["detected"]).sum()
print(f"Correctly classified: {detected_correctly}/{n_pairs}")
print(f"\nCointegrated pairs (p<0.05):")
print(df[df["detected"]][["pair","p_val","beta","half_life"]].to_string(index=False))`,
    explanation: "Cointegration differs fundamentally from correlation: two assets can be perfectly correlated yet diverge permanently (both trending), while cointegrated assets share a common stochastic trend and their spread is stationary; the half-life from the AR(1) residual fit determines the expected reversion time and thus the optimal holding period for the pairs trade.",
  },
  {
    id: "pyfin-20260626-b1-cs-momentum",
    language: "python",
    title: "Cross-Sectional Momentum Factor Construction",
    tag: "factor models",
    code: `import numpy as np
import pandas as pd

np.random.seed(55)
n_stocks  = 100
n_months  = 60   # 5 years monthly

# Simulate monthly returns with some cross-sectional momentum structure
# True 12-1 momentum signal has IC ~0.05
base_returns = np.random.randn(n_months, n_stocks) * 0.05 + 0.006

# Inject momentum: past 12-month return predicts 1-month forward (weakly)
for t in range(12, n_months - 1):
    past_12 = base_returns[t-12:t, :].sum(axis=0)
    z       = (past_12 - past_12.mean()) / past_12.std()
    base_returns[t+1, :] += 0.003 * z   # small predictive signal

dates   = pd.date_range("2019-01-31", periods=n_months, freq="ME")
ret_df  = pd.DataFrame(base_returns, index=dates,
                        columns=[f"S{i:03d}" for i in range(n_stocks)])

# 12-1 momentum: cumulative return months t-12 to t-1 (skip last month)
factor_returns = []
for t in range(13, n_months):
    # Formation period: months t-12 to t-2 (inclusive)
    form_ret = ret_df.iloc[t-12:t-1, :].sum()   # 11-month cumulative
    # Skip last month (t-1): avoid short-term reversal
    # Rank into deciles
    ranks = form_ret.rank(pct=True)
    top    = ranks >= 0.90    # top decile (winners)
    bottom = ranks <= 0.10    # bottom decile (losers)
    n_top, n_bot = top.sum(), bottom.sum()
    if n_top == 0 or n_bot == 0:
        continue
    # Equal-weight long-short
    w = np.zeros(n_stocks)
    w[top.values]    =  1.0 / n_top
    w[bottom.values] = -1.0 / n_bot
    # Holding period: month t
    factor_ret = (w * ret_df.iloc[t].values).sum()
    factor_returns.append({"date": dates[t], "mom_factor": factor_ret})

mom_df = pd.DataFrame(factor_returns).set_index("date")
ann_ret = mom_df["mom_factor"].mean() * 12
ann_vol = mom_df["mom_factor"].std() * np.sqrt(12)
sharpe  = ann_ret / ann_vol
hit_rate = (mom_df["mom_factor"] > 0).mean()

print(f"Cross-Sectional Momentum Factor (12-1 month):")
print(f"  Annualized return: {ann_ret:.2%}")
print(f"  Annualized vol:    {ann_vol:.2%}")
print(f"  Sharpe ratio:      {sharpe:.2f}")
print(f"  Hit rate:          {hit_rate:.2%}")
print(f"  Monthly IC (corr): {mom_df['mom_factor'].autocorr(1):.3f}")`,
    explanation: "Cross-sectional momentum bets on relative performance — ranking stocks against each other and longing winners while shorting losers — distinct from time-series momentum which bets on whether a single asset's absolute trend continues; skipping the most recent month avoids the short-term reversal effect that would otherwise erode returns.",
  },
  {
    id: "pyfin-20260626-b1-margrabe",
    language: "python",
    title: "Margrabe Exchange Option Formula",
    tag: "options",
    code: `import numpy as np
from scipy.stats import norm

def margrabe_price(S1, S2, T, sigma1, sigma2, rho, q1=0.0, q2=0.0):
    """
    Margrabe (1978): price of option to exchange S2 for S1 at time T.
    Payoff = max(S1_T - S2_T, 0).
    sigma_combined = sqrt(sigma1^2 + sigma2^2 - 2*rho*sigma1*sigma2)
    """
    sigma = np.sqrt(sigma1**2 + sigma2**2 - 2 * rho * sigma1 * sigma2)
    if sigma < 1e-10 or T < 1e-10:
        return max(S1 - S2, 0.0)

    # Treat S2*exp(-q2*T) as the 'strike' and S1*exp(-q1*T) as 'spot'
    F1  = S1 * np.exp(-q1 * T)
    F2  = S2 * np.exp(-q2 * T)
    d1  = (np.log(F1 / F2) + 0.5 * sigma**2 * T) / (sigma * np.sqrt(T))
    d2  = d1 - sigma * np.sqrt(T)
    return F1 * norm.cdf(d1) - F2 * norm.cdf(d2)

def margrabe_greeks(S1, S2, T, sigma1, sigma2, rho, eps=0.01):
    """Bump-and-reprice Greeks for exchange option."""
    base = margrabe_price(S1, S2, T, sigma1, sigma2, rho)
    delta1 = (margrabe_price(S1*(1+eps), S2, T, sigma1, sigma2, rho)
              - margrabe_price(S1*(1-eps), S2, T, sigma1, sigma2, rho)) / (2*S1*eps)
    delta2 = (margrabe_price(S1, S2*(1+eps), T, sigma1, sigma2, rho)
              - margrabe_price(S1, S2*(1-eps), T, sigma1, sigma2, rho)) / (2*S2*eps)
    vega1  = (margrabe_price(S1, S2, T, sigma1+0.01, sigma2, rho)
              - margrabe_price(S1, S2, T, sigma1-0.01, sigma2, rho)) / 0.02
    return {"price": base, "delta1": delta1, "delta2": delta2, "vega1": vega1}

# Example: spread option on two correlated commodity contracts
S1, S2   = 105.0, 100.0   # cracking spread: refined vs crude
sigma1, sigma2 = 0.30, 0.25
T        = 0.5   # 6 months

print("Margrabe Exchange Option (right to exchange S2 for S1):")
for rho in [-0.5, 0.0, 0.5, 0.8, 0.95]:
    price = margrabe_price(S1, S2, T, sigma1, sigma2, rho)
    sigma_eff = np.sqrt(sigma1**2 + sigma2**2 - 2*rho*sigma1*sigma2)
    print(f"  rho={rho:+.2f}  sigma_eff={sigma_eff:.4f}  price={price:.4f}")

g = margrabe_greeks(S1, S2, T, sigma1, sigma2, rho=0.5)
print(f"\nGreeks at rho=0.50: {g}")`,
    explanation: "Margrabe's formula generalizes Black-Scholes by using S2 as the numeraire — in the S2-denominated world, S1/S2 behaves like a single asset with combined volatility sqrt(σ₁²+σ₂²-2ρσ₁σ₂); as correlation approaches 1, the exchange option approaches zero because the two assets move together and the spread shrinks.",
  },
  {
    id: "pyfin-20260626-b1-variance-swap",
    language: "python",
    title: "Variance Swap Replication and Fair Strike",
    tag: "volatility",
    code: `import numpy as np
from scipy.integrate import quad
from scipy.stats import norm

def bs_call(S, K, T, r, sigma):
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return S*norm.cdf(d1) - K*np.exp(-r*T)*norm.cdf(d2)

def bs_put(S, K, T, r, sigma):
    d1 = (np.log(S/K) + (r + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma*np.sqrt(T)
    return K*np.exp(-r*T)*norm.cdf(-d2) - S*norm.cdf(-d1)

def variance_swap_strike(S0, T, r, smile_fn):
    """
    Carr-Madan/Britten-Jones replication:
    K_var = (2/T) * [int_0^F put(K)/K^2 dK + int_F^inf call(K)/K^2 dK]
    """
    F = S0 * np.exp(r * T)   # forward price
    I_put,  _ = quad(lambda K: bs_put(S0, K, T, r, smile_fn(K)) / K**2,
                     0.01, F, limit=300, epsabs=1e-10)
    I_call, _ = quad(lambda K: bs_call(S0, K, T, r, smile_fn(K)) / K**2,
                     F, S0 * 8, limit=300, epsabs=1e-10)
    return (2 / T) * (I_put + I_call)

S0, T, r = 100.0, 1.0, 0.05

# Flat smile: K_var should equal sigma^2 exactly
for atm_vol in [0.15, 0.20, 0.25]:
    kv = variance_swap_strike(S0, T, r, lambda K: atm_vol)
    print(f"Flat vol={atm_vol:.0%}  K_var={kv:.6f}  (expected={atm_vol**2:.6f})")

# Skewed smile: downward put skew increases K_var above ATM vol^2
def skew_smile(K, S=100, atm=0.20, skew=-0.08):
    return max(atm + skew * np.log(K / S), 0.05)

kv_skew = variance_swap_strike(S0, T, r, skew_smile)
print(f"\nSkewed smile (skew=-8%/ln-moneyness):")
print(f"  K_var = {kv_skew:.6f}  sqrt(K_var) = {np.sqrt(kv_skew):.4%}")
print(f"  ATM vol = {skew_smile(S0):.4%}")
print(f"  Variance risk premium proxy (var swap > ATM^2): {kv_skew > 0.20**2}")

# Discrete realized variance calculation
np.random.seed(1)
N  = 252
S  = S0 * np.cumprod(np.exp(np.random.randn(N) * 0.012))
realized_var = (252 / N) * np.sum(np.log(S[1:] / S[:-1])**2)
print(f"\nRealized variance: {realized_var:.6f}  Realized vol: {np.sqrt(realized_var):.4%}")`,
    explanation: "A variance swap pays the buyer (realized variance − K_var) × notional, so the fair strike K_var is the risk-neutral expectation of future realized variance; the replication formula is model-free and shows that a volatility skew (expensive OTM puts) always raises K_var above ATM-implied-vol-squared — this gap is the variance risk premium.",
  },
  {
    id: "pyfin-20260626-b1-local-vol",
    language: "python",
    title: "Dupire Local Volatility Surface",
    tag: "options",
    code: `import numpy as np
from scipy.stats import norm
from scipy.interpolate import RectBivariateSpline

def bs_call_grid(S, K, T, r, q, sigma):
    """Vectorized BS call; K and T can be arrays."""
    K, T = np.asarray(K), np.asarray(T)
    d1 = (np.log(S/K) + (r - q + 0.5*sigma**2)*T) / (sigma*np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    return (S * np.exp(-q*T) * norm.cdf(d1)
            - K * np.exp(-r*T) * norm.cdf(d2))

# Build implied vol surface on a (K, T) grid
S0, r, q = 100.0, 0.05, 0.02
strikes  = np.linspace(70, 140, 30)
tenors   = np.linspace(0.1, 2.0, 20)
K_grid, T_grid = np.meshgrid(strikes, tenors, indexing="ij")  # (30, 20)

# Parameterized smile: ATM vol + skew + curvature
def implied_vol_surface(K, T):
    atm    = 0.20
    skew   = -0.05 * np.log(K / S0)
    convex =  0.02 * np.log(K / S0)**2
    term   = -0.02 * np.sqrt(T)        # vol term structure (small effect)
    return atm + skew + convex + term

iv_surface = implied_vol_surface(K_grid, T_grid)
C_surface  = bs_call_grid(S0, K_grid, T_grid, r, q, iv_surface)

# Dupire formula: sigma_loc^2 = (dC/dT + q*C + (r-q)*K*dC/dK) / (0.5*K^2*d^2C/dK^2)
# Approximate partial derivatives via finite differences on the grid
dK = strikes[1] - strikes[0]
dT = tenors[1] - tenors[0]

dCdT = np.gradient(C_surface, dT, axis=1)          # (30, 20)
dCdK = np.gradient(C_surface, dK, axis=0)          # (30, 20)
d2CdK2 = np.gradient(dCdK, dK, axis=0)             # (30, 20)

numerator   = dCdT + q * C_surface + (r - q) * K_grid * dCdK
denominator = 0.5 * K_grid**2 * d2CdK2
local_var   = np.where(denominator > 1e-10, numerator / denominator, np.nan)
local_vol   = np.sqrt(np.clip(local_var, 0, None))

# Show local vol slice at T=1y vs implied vol
t_idx = np.argmin(np.abs(tenors - 1.0))
print(f"Strike  ImpliedVol  LocalVol (T=1.0y)")
for i in range(0, 30, 4):
    iv = iv_surface[i, t_idx]
    lv = local_vol[i, t_idx]
    print(f"  K={strikes[i]:5.0f}   {iv:.4f}       {lv:.4f}")`,
    explanation: "Dupire's local volatility is the unique diffusion coefficient sigma_loc(K,T) consistent with all observed option prices simultaneously — it makes the model complete and arbitrage-free; numerically, finite differences on the implied vol surface amplify noise in d²C/dK², so real implementations use parametric surfaces (SVI) or regularization before applying the formula.",
  },
  {
    id: "pyfin-20260626-b1-short-rate-sim",
    language: "python",
    title: "Multi-Model Short-Rate Simulation Comparison",
    tag: "fixed income",
    code: `import numpy as np

np.random.seed(42)

# Model parameters
r0       = 0.03    # initial short rate
kappa    = 0.50    # mean-reversion speed
theta    = 0.04    # long-run mean
sigma    = 0.01    # vol (Vasicek/HW)
sigma_cir = 0.08   # vol for CIR (applied to sqrt(r))
T        = 10.0
n_steps  = 2520    # daily steps (252 * 10)
n_paths  = 10_000
dt       = T / n_steps

# Common random numbers for fair comparison
W = np.random.randn(n_steps, n_paths)

def simulate_vasicek(W):
    """dr = kappa*(theta - r)*dt + sigma*dW   (can go negative)"""
    r = np.full(n_paths, r0)
    paths = [r.copy()]
    for i in range(n_steps):
        dr = kappa * (theta - r) * dt + sigma * np.sqrt(dt) * W[i]
        r  = r + dr
        paths.append(r.copy())
    return np.array(paths)   # (n_steps+1, n_paths)

def simulate_cir(W):
    """dr = kappa*(theta - r)*dt + sigma_cir*sqrt(r)*dW  (r >= 0 if Feller met)"""
    r = np.full(n_paths, r0)
    paths = [r.copy()]
    feller = 2 * kappa * theta > sigma_cir**2
    for i in range(n_steps):
        r_pos = np.maximum(r, 0)    # full truncation to prevent negative rates
        dr    = kappa * (theta - r_pos) * dt + sigma_cir * np.sqrt(r_pos * dt) * W[i]
        r     = r_pos + dr
        paths.append(r.copy())
    return np.array(paths), feller

def simulate_hw(W, theta_t=None):
    """dr = kappa*(theta(t) - r)*dt + sigma*dW  (theta varies; use constant here)"""
    r = np.full(n_paths, r0)
    paths = [r.copy()]
    for i in range(n_steps):
        th = theta if theta_t is None else theta_t[i]
        dr = kappa * (th - r) * dt + sigma * np.sqrt(dt) * W[i]
        r  = r + dr
        paths.append(r.copy())
    return np.array(paths)

vas = simulate_vasicek(W)
cir, feller_ok = simulate_cir(W)
hw  = simulate_hw(W)

# Fraction of paths with negative rates
vas_neg = (vas < 0).mean()
cir_neg = (cir < 0).mean()

print(f"Feller condition (2*kappa*theta > sigma_cir^2): {feller_ok}")
print(f"Vasicek neg rate fraction: {vas_neg:.4%}")
print(f"CIR     neg rate fraction: {cir_neg:.4%}")

# ZCB pricing via MC: B(0,T) = E[exp(-int_0^T r dt)]
def zcb_mc(paths, T_target):
    t_steps = int(T_target / T * n_steps)
    int_r   = paths[:t_steps+1].mean(axis=0) * T_target   # trapezoidal
    return np.exp(-int_r).mean()

print("\nZero-coupon bond prices B(0,T):")
for t_mat in [1, 3, 5, 10]:
    bv = zcb_mc(vas, t_mat);  bcir = zcb_mc(cir, t_mat);  bhw = zcb_mc(hw, t_mat)
    yv = -np.log(bv)/t_mat;  ycir = -np.log(bcir)/t_mat; yhw = -np.log(bhw)/t_mat
    print(f"  T={t_mat:2d}y  Vasicek: {yv:.4%}  CIR: {ycir:.4%}  HW: {yhw:.4%}")`,
    explanation: "CIR avoids negative rates through the sqrt(r) diffusion coefficient, which dampens volatility as rates approach zero — if the Feller condition 2κθ > σ² holds, rates never reach zero in continuous time; Vasicek's constant diffusion is analytically tractable (rates are Gaussian) but allows negative rates, making it unsuitable when modeling scenarios near the zero lower bound.",
  },
];
