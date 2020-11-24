class Revenue {

  constructor() {
    this.reset();
    this.people = 1;
  }
  
  declareSalaryIncome(amount, pensionContribRate) {
    this.income += amount;
    this.pensionContribRelief += pensionContribRate * Math.min(amount, adjust_(115000,inflation));
    this.salaries++;
    if (this.salaries > 1) {
      this.people = 2;
    }
  }
  
  declareNonEuSharesIncome(amount) {
    this.nonEuShares += amount;
  }
  
  declarePrivatePensionIncome(amount) {
    this.privatePension += amount;
  }
  
  declareStatePensionIncome(amount) {
    this.statePension += amount;
  }
  
  declareInvestmentIncome(amount) {
    this.investmentIncome += amount;
  }
  
  declareOtherIncome(amount) {
    this.income += amount;
  }
    
  declareInvestmentGains(amount, taxRate) {
    if (!this.gains.hasOwnProperty(taxRate)) {
      this.gains[taxRate] = 0;
    }
    this.gains[taxRate] += amount;
  }
    
  computeTaxes() {
    this.computePAYE();
    this.computePRSI();
    this.computeUSC();
    this.computeCGT();
  }
   
  netIncome() {
    this.computeTaxes();
    let gross = this.income + this.privatePension + this.statePension + this.investmentIncome + this.nonEuShares;
    let taxCredit = (age < 65) ? 0 : adjust_(this.people * 245, inflation);
    let tax = Math.max(this.paye + this.prsi + this.usc + this.cgt - taxCredit, 0);
    return gross - tax;
  }
  
  reset() {
    this.gains = [];
    this.income = 0;
    this.nonEuShares = 0;
    this.statePension = 0;
    this.privatePension = 0;
    this.investmentIncome = 0;
    this.pensionContribRelief = 0;
    this.salaries = 0;
    this.paye = 0;
    this.prsi = 0;
    this.usc = 0;
    this.cgt = 0;
  }
  
  computePAYE() {
    let taxable = this.income + this.privatePension + this.nonEuShares - this.pensionContribRelief;
    let limit = adjust_(incomeTaxBracket + (this.salaries > 1 ? 26300 : 0), inflation);
    let tax = 0.2 * Math.min(taxable, limit) + 0.4 * Math.max(taxable - limit, 0);
    let credit = adjust_(this.people * incomeTaxCredit, inflation);
    if (age < 65 || taxable > adjust_(this.people * 18000, inflation)) {
      this.paye = Math.max(tax - credit, 0);
    } else {
      this.paye = 0;
    }
  }
  
  computePRSI() {
    let taxable = this.income + this.nonEuShares;
    let tax = (age <= 66) ? taxable * 0.04 : 0;
    this.prsi = tax;
  }
  
  computeUSC(amount) {
    let taxable = this.income + this.privatePension + this.nonEuShares;
    let exempt = adjust_(13000, inflation);
    let exceed = adjust_(60000, inflation);
    let limit1 = adjust_(12012, inflation);
    let limit2 = adjust_(20484, inflation) - limit1;
    let limit3 = adjust_(70044, inflation) - limit1 - limit2;
    let tax = 0;
    if (taxable > exempt) {
      if (age >= 70 && taxable <= exceed) {
        tax += 0.005 * Math.min(taxable, limit1);
        taxable -= limit1;
        tax += 0.020 * Math.max(0, taxable);
      } else {      
        tax += 0.005 * Math.min(taxable, limit1);
        taxable -= limit1;
        tax += 0.020 * Math.max(0, Math.min(taxable, limit2));
        taxable -= limit2;
        tax += 0.045 * Math.max(0, Math.min(taxable, limit3));
        taxable -= limit3;
        tax += 0.080 * Math.max(0, taxable);
      }
    }
    this.usc = tax;
  }
  
  computeCGT() {
    let tax = 0;
    let taxable = -adjust_(1270, inflation); // capital gains tax credit
    // go through the gains from the highest taxed to the least taxed, so that the credit has more impact
    for (let [taxRate, gains] of Object.entries(this.gains).sort((a,b) => b[0].localeCompare(a[0]))) {
      taxable += gains;
      tax += Math.max(taxable * taxRate, 0);
    }
    this.cgt = tax;
  }
    
}
