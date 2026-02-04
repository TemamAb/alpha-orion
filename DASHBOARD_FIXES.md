# Dashboard Fixes - Implementation Guide

## ISSUE #1: MetaMask Wallet Detection Failing

### Root Cause
The `connectWallet()` function checks for `window.ethereum` synchronously at button click time, but MetaMask might not have injected it yet. Additionally, the auto-detection on page load runs only once and doesn't retry.

### Solution A: Fix with Retry Logic (Recommended)

Replace the entire script section (lines 1476-1696) with:

```javascript
<script>
    document.addEventListener('DOMContentLoaded', function() {
        const app = {
            walletCheckRetries: 0,
            maxRetries: 10,
            
            init() {
                console.log('Alpha-Orion Dashboard Initialized');
                this.bindNavEvents();
                this.bindCurrencyToggle();
                this.bindSettingsEvents();
                
                // Retry wallet detection with exponential backoff
                this.retryWalletConnection();
                
                // Listen for wallet changes
                if (typeof window.ethereum !== 'undefined') {
                    window.ethereum.on('accountsChanged', (accounts) => {
                        if (accounts.length > 0) {
                            document.getElementById('wallet-address').value = accounts[0];
                            app.updateWalletStatus('Wallet switched ✓', 'success');
                        }
                    });
                }
                
                this.showCategory('profit-analytics');
            },

            retryWalletConnection() {
                this.checkWalletConnection().then((found) => {
                    if (!found && this.walletCheckRetries < this.maxRetries) {
                        this.walletCheckRetries++;
                        const delay = Math.min(1000 * Math.pow(1.5, this.walletCheckRetries), 5000);
                        setTimeout(() => this.retryWalletConnection(), delay);
                    }
                });
            },

            async checkWalletConnection() {
                if (typeof window.ethereum !== 'undefined') {
                    try {
                        const accounts = await window.ethereum.request({ 
                            method: 'eth_accounts' 
                        });
                        if (accounts.length > 0) {
                            document.getElementById('wallet-address').value = accounts[0];
                            app.updateWalletStatus('Wallet detected ✓', 'success');
                            console.log('Wallet auto-detected:', accounts[0]);
                            return true;
                        }
                    } catch (error) {
                        console.error('Error checking wallet connection:', error);
                    }
                }
                return false;
            },

            bindNavEvents() {
                const navItems = document.querySelectorAll('.nav-item');
                navItems.forEach(item => {
                    item.addEventListener('click', (e) => {
                        const category = e.currentTarget.dataset.category;
                        this.showCategory(category);
                    });
                });
            },

            bindCurrencyToggle() {
                const currencyButtons = document.querySelectorAll('.currency-btn');
                currencyButtons.forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        currencyButtons.forEach(b => b.classList.remove('active'));
                        e.currentTarget.classList.add('active');
                        console.log(`Currency set to ${e.currentTarget.dataset.currency}`);
                    });
                });
            },

            bindSettingsEvents() {
                document.querySelectorAll('input[name="withdrawal-mode"]').forEach(radio => {
                    radio.addEventListener('change', this.toggleWithdrawalMode);
                });
                document.getElementById('btn-connect-wallet').addEventListener('click', () => this.connectWallet());
                document.getElementById('btn-validate-wallet').addEventListener('click', () => this.validateWallet());
                document.getElementById('btn-save-settings').addEventListener('click', () => this.saveSettings());
                document.getElementById('btn-save-confirm').addEventListener('click', () => this.saveAndConfirm());
                document.getElementById('btn-withdraw-manual').addEventListener('click', () => this.withdrawManual());
            },

            async connectWallet() {
                if (typeof window.ethereum === 'undefined') {
                    app.updateWalletStatus('MetaMask not found. Install it here: https://metamask.io', 'warning');
                    return;
                }
                
                try {
                    const accounts = await window.ethereum.request({ 
                        method: 'eth_requestAccounts' 
                    });
                    if (accounts.length > 0) {
                        document.getElementById('wallet-address').value = accounts[0];
                        app.updateWalletStatus('Wallet connected ✓', 'success');
                        console.log('Connected wallet:', accounts[0]);
                    }
                } catch (error) {
                    if (error.code === 4001) {
                        app.updateWalletStatus('Connection rejected by user ✗', 'danger');
                    } else {
                        console.error('Connection error:', error);
                        app.updateWalletStatus('Connection failed. Retry?', 'danger');
                    }
                }
            },

            validateWallet() {
                const address = document.getElementById('wallet-address').value;
                if (ethers.utils.isAddress(address)) {
                    app.updateWalletStatus('Address valid ✓', 'success');
                } else {
                    app.updateWalletStatus('Invalid Ethereum address ✗', 'danger');
                }
            },

            updateWalletStatus(message, type) {
                const statusEl = document.getElementById('wallet-status');
                statusEl.textContent = message;
                statusEl.style.color = type === 'success' ? 'var(--accent-secondary)' : 
                                        type === 'warning' ? 'var(--accent-warning)' : 
                                        'var(--accent-danger)';
            },

            showCategory(category) {
                document.querySelectorAll('[id^="category-"]').forEach(cat => cat.classList.add('hidden'));
                const selectedCategory = document.getElementById('category-' + category);
                if (selectedCategory) {
                    selectedCategory.classList.remove('hidden');
                }

                document.querySelectorAll('.nav-item').forEach(item => {
                    item.classList.remove('active');
                    if (item.dataset.category === category) {
                        item.classList.add('active');
                    }
                });
            },

            toggleWithdrawalMode() {
                const autoGroup = document.getElementById('auto-threshold-group');
                const manualGroup = document.getElementById('manual-amount-group');
                const isAuto = document.getElementById('withdrawal-mode-auto').checked;
                autoGroup.style.display = isAuto ? 'block' : 'none';
                manualGroup.style.display = isAuto ? 'none' : 'block';
            },

            saveSettings() {
                const walletAddress = document.getElementById('wallet-address').value;
                if (!ethers.utils.isAddress(walletAddress)) {
                    alert('Please enter a valid Ethereum wallet address.');
                    return false;
                }
                console.log('Settings saved.');
                alert('Settings saved successfully!');
                return true;
            },

            saveAndConfirm() {
                if (app.saveSettings()) {
                    if (confirm('Are you sure you want to apply these withdrawal settings?')) {
                        alert('Settings confirmed and applied!');
                    }
                }
            },

            withdrawManual() {
                const amount = document.getElementById('manual-amount').value;
                const walletAddress = document.getElementById('wallet-address').value;
                if (!amount || amount < 50) {
                    alert('Minimum withdrawal amount is $50.');
                    return;
                }
                if (!ethers.utils.isAddress(walletAddress)) {
                    alert('Please enter a valid wallet address.');
                    return;
                }
                if (confirm(`Withdraw $${amount} to ${walletAddress}?`)) {
                    alert(`Withdrawal of $${amount} initiated successfully!`);
                    app.addTransferHistory('Manual', amount);
                }
            },

            addTransferHistory(type, amount) {
                const historyContainer = document.querySelector('.settings-group:last-child div[style*="overflow-y"]');
                if (!historyContainer) return;
                
                const newEntry = document.createElement('div');
                newEntry.style.cssText = 'padding: 0.3rem 0; border-bottom: 1px solid var(--border-color); font-size: 0.75rem;';
                const timestamp = new Date().toLocaleDateString();
                newEntry.innerHTML = `<div>${type}: $${amount} - ${timestamp}</div>`;
                historyContainer.prepend(newEntry);
            }
        };

        app.init();
    });
</script>
```

### Solution B: Use Web3Modal (Alternative - Best Practice)

Add to the `<head>`:
```html
<script src="https://cdn.jsdelivr.net/npm/web3modal@1.9.12/dist/index.js"></script>
<script src="https://cdn.jsdelivr.net/npm/evm-chains@0.2.0/dist/index.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/web3@1.10.0/dist/web3.min.js"></script>
```

Replace `connectWallet()` function:
```javascript
async connectWallet() {
    const Web3Modal = window.Web3Modal.default;
    const web3 = window.web3;
    
    const web3modal = new Web3Modal({
        network: "mainnet",
        cacheProvider: true,
        providerOptions: {}
    });

    try {
        const provider = await web3modal.connect();
        const web3Instance = new web3(provider);
        const accounts = await web3Instance.eth.getAccounts();
        
        if (accounts.length > 0) {
            document.getElementById('wallet-address').value = accounts[0];
            app.updateWalletStatus('Wallet connected ✓', 'success');
        }
    } catch (error) {
        console.error('Connection error:', error);
        app.updateWalletStatus('Connection failed ✗', 'danger');
    }
}
```

---

## ISSUE #2: Settings Panel Overflow & Size

### Solution: CSS & HTML Restructuring

#### Step 1: Fix Main Content Scrolling

**Find (around line 222):**
```css
.main-content {
    margin-left: var(--sidebar-width);
    margin-top: 80px;
    margin-bottom: 0;
    height: calc(100vh - 80px);
    overflow: hidden;  /* ← PROBLEM */
    position: relative;
    background: radial-gradient(circle at top right, rgba(59, 130, 246, 0.05), transparent 40%);
}
```

**Replace with:**
```css
.main-content {
    margin-left: var(--sidebar-width);
    margin-top: 80px;
    margin-bottom: 40px;  /* Space for footer */
    min-height: calc(100vh - 80px - 40px);
    overflow-y: auto;  /* ✓ ENABLE SCROLLING */
    overflow-x: hidden;
    position: relative;
    background: radial-gradient(circle at top right, rgba(59, 130, 246, 0.05), transparent 40%);
}
```

#### Step 2: Optimize Settings Panel Container

**Find (around line 155-179):**
```css
.settings-group {
    margin-bottom: 2rem;
}
.settings-label {
    font-size: 0.9rem;
    color: var(--text-muted);
    margin-bottom: 0.75rem;
    display: block;
}
.settings-input {
    width: 100%;
    background: var(--bg-dark);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 0.75rem;
    color: var(--text-main);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.9rem;
}
```

**Replace with:**
```css
.settings-group {
    margin-bottom: 1.5rem;  /* Reduce from 2rem */
}
.settings-label {
    font-size: 0.95rem;  /* Increase from 0.9rem */
    color: var(--text-muted);
    margin-bottom: 0.5rem;  /* Reduce from 0.75rem */
    display: block;
    font-weight: 500;
}
.settings-input {
    width: 100%;
    background: var(--bg-dark);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 0.875rem 0.75rem;  /* Increase from 0.75rem */
    color: var(--text-main);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.95rem;  /* Increase from 0.9rem */
    min-height: 40px;  /* Ensure clickable size */
}
```

#### Step 3: Fix Transfer History Display

**Find (around line 1462):**
```html
<div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 3px; padding: 0.25rem; max-height: 100px; overflow-y: auto; font-size: 0.65rem;">
```

**Replace with:**
```html
<div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 3px; padding: 0.5rem; max-height: 250px; overflow-y: auto; font-size: 0.8rem;">
```

#### Step 4: Improve Performance Card for Settings

**Add new CSS rule (after line 435):**
```css
/* Settings Card Optimization */
#category-settings {
    max-width: 800px;  /* Constrain width */
    margin: 0 auto;     /* Center on screen */
}

#category-settings .performance-card {
    padding: 2rem;  /* Increase padding */
    background-color: var(--bg-card);
}

#category-settings .card-header {
    margin-bottom: 2rem;  /* Increase spacing */
}
```

#### Step 5: Increase Button Sizes

**Find buttons in settings (around line 1432):**
```html
<button id="btn-connect-wallet" style="background: var(--accent-primary); color: white; border: none; border-radius: 3px; padding: 0.3rem 0.6rem; font-size: 0.7rem; cursor: pointer;">Connect</button>
```

**Replace with:**
```html
<button id="btn-connect-wallet" style="background: var(--accent-primary); color: white; border: none; border-radius: 6px; padding: 0.6rem 1.2rem; font-size: 0.85rem; font-weight: 500; cursor: pointer; min-height: 38px; flex: 1;">Connect</button>
```

Apply to all buttons in settings section:
- `btn-connect-wallet`
- `btn-validate-wallet`
- `btn-save-settings`
- `btn-save-confirm`
- `btn-withdraw-manual`

#### Step 6: Reorganize Settings with Tabs (Optional Enhancement)

Add HTML before the settings category content:

```html
<!-- SETTINGS TABS -->
<div style="display: flex; gap: 1rem; border-bottom: 2px solid var(--border-color); margin-bottom: 2rem;">
    <button class="settings-tab active" data-tab="withdrawal" style="padding: 1rem; border: none; background: transparent; color: var(--accent-primary); cursor: pointer; font-weight: 500; border-bottom: 2px solid var(--accent-primary); margin-bottom: -2px;">💰 Withdrawal</button>
    <button class="settings-tab" data-tab="wallet" style="padding: 1rem; border: none; background: transparent; color: var(--text-muted); cursor: pointer; font-weight: 500;">🔑 Wallet</button>
    <button class="settings-tab" data-tab="history" style="padding: 1rem; border: none; background: transparent; color: var(--text-muted); cursor: pointer; font-weight: 500;">📜 History</button>
</div>

<!-- TAB CONTENT -->
<div id="tab-withdrawal" class="settings-tab-content">
    <!-- Withdrawal content here -->
</div>
<div id="tab-wallet" class="settings-tab-content hidden">
    <!-- Wallet content here -->
</div>
<div id="tab-history" class="settings-tab-content hidden">
    <!-- History content here -->
</div>
```

Add JavaScript:
```javascript
document.querySelectorAll('.settings-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab;
        document.querySelectorAll('.settings-tab').forEach(t => {
            t.style.color = 'var(--text-muted)';
            t.style.borderColor = 'transparent';
        });
        e.target.style.color = 'var(--accent-primary)';
        e.target.style.borderColor = 'var(--accent-primary)';
        
        document.querySelectorAll('.settings-tab-content').forEach(c => c.classList.add('hidden'));
        document.getElementById('tab-' + tabName).classList.remove('hidden');
    });
});
```

---

## Testing Checklist

After applying fixes:

### Wallet Connection Tests
- [ ] MetaMask installed, page loads → wallet auto-fills
- [ ] MetaMask not installed initially, then installed → wallet detects after refresh
- [ ] Click "Connect" button → MetaMask popup appears
- [ ] User approves → wallet address filled
- [ ] User rejects → error message shown
- [ ] Click "Validate" → validates address format
- [ ] Account changed in MetaMask → dashboard detects change

### Settings Panel Tests
- [ ] Settings category displays fully
- [ ] Can scroll through all content
- [ ] Transfer history shows multiple entries
- [ ] All buttons are clickable (not cut off)
- [ ] Font sizes readable
- [ ] Mobile responsiveness (smaller screens)
- [ ] No horizontal scrollbar

### Browser Console
- [ ] No JavaScript errors
- [ ] No duplicate function warnings
- [ ] Wallet detection logs show retries
- [ ] Final connection status logged

---

## File Changes Summary

| File | Changes | Lines |
|------|---------|-------|
| `approved-dashboard.html` | Fix MetaMask detection | 1476-1637 |
| `approved-dashboard.html` | Enable content scrolling | ~227 |
| `approved-dashboard.html` | Improve settings styling | ~155-179 |
| `approved-dashboard.html` | Fix transfer history | ~1462 |
| `approved-dashboard.html` | Increase button sizes | ~1432-1456 |

