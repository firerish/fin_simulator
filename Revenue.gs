class Revenue {

  constructor(married=false) {
    this.reset();
    this.people = 1;
    this.pensionContribEarningLimit = 115000;
    this.itEmployeeTaxCredit = 1650;
    this.itExemptionLimit = 18000;
    this.itExemptionAge = 65;
    this.itMarriedBandIncrease = 26300;
    this.itLowerBandRate = 0.2;
    this.itHigherBandRate = 0.4;
    this.ageTaxCredit = 245;
    this.pensionableAge = 66;
    this.prsiRate = 0.04;
    this.uscExemptAmount = 13000;
    this.usc70notExceed = 60000;
    this.uscLimit1 = 12012;
    this.uscLimit2 = 8472;
    this.uscLimit3 = 49560;
    this.uscRate1 = 0.005;
    this.uscRate2 = 0.020;
    this.uscRate3 = 0.045;
    this.uscRate4 = 0.080;
    this.cgtTaxRelief = 1270;
  }
  
  declareSalaryIncome(amount, pensionContribRate) {
    this.income += amount;
    this.pensionContribAmount += pensionContribRate * amount;
    this.pensionContribRelief += pensionContribRate * Math.min(amount, adjust_(this.pensionContribEarningLimit, inflation));
    this.salaries.push(amount);
    this.salaries.sort((a,b) => a-b); // sort lower to higher
    if (this.salaries.length > 1) this.people = 2;
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
    this.computeIT();
    this.computePRSI();
    this.computeUSC();
    this.computeCGT();
  }
   
  netIncome() {
    this.computeTaxes();
    let gross = this.income - this.pensionContribAmount + this.privatePension + this.statePension + this.investmentIncome + this.nonEuShares;
    let taxCredit = (age < 65) ? 0 : adjust_(this.people * this.ageTaxCredit, inflation);
    let tax = Math.max(this.it + this.prsi + this.usc + this.cgt - taxCredit, 0);
    return gross - tax;
  }
  
  reset() {
    this.gains = [];
    this.income = 0;
    this.nonEuShares = 0;
    this.statePension = 0;
    this.privatePension = 0;
    this.investmentIncome = 0;
    this.pensionContribAmount = 0;
    this.pensionContribRelief = 0;
    this.salaries = [];
    this.it = 0;
    this.prsi = 0;
    this.usc = 0;
    this.cgt = 0;
  }
  
  computeIT() {
    let taxable = this.income + this.privatePension + this.nonEuShares - this.pensionContribRelief;
    let limit = adjust_(incomeTaxBracket + (this.salaries.length > 1 ? Math.min(this.itMarriedBandIncrease, this.salaries[0]) : 0), inflation);
    let tax = this.itLowerBandRate * Math.min(taxable, limit) + this.itHigherBandRate * Math.max(taxable - limit, 0);
    let credit = adjust_(personalTaxCredit + this.salaries.length * this.itEmployeeTaxCredit, inflation);
    let exemption = this.people * this.itExemptionLimit;
    if (age < this.itExemptionAge || taxable > adjust_(exemption, inflation)) {
      this.it = Math.max(tax - credit, 0);
    } else {
      this.it = 0;
    }
  }
  
  computePRSI() {
    let taxable = this.income + this.nonEuShares;
    let tax = (age <= this.pensionableAge) ? taxable * this.prsiRate : 0;
    this.prsi = tax;
  }
  
  computeUSC() {
    // USC is applied to each individual's salary separately. 
    // Any extra taxable income is applied to the lowest salary for tax efficiency.
    // To do this the extra is added to the first salary, as they are sorted in ascending order.
    this.usc = 0;
    let extraIncome = this.privatePension + this.nonEuShares;
    for (let income of this.salaries) {
      let taxable = income + extraIncome;
      extraIncome = 0;
      let exempt = adjust_(this.uscExemptAmount, inflation);
      let exceed = adjust_(this.usc70notExceed, inflation);
      let limit1 = adjust_(this.uscLimit1, inflation);
      let limit2 = adjust_(this.uscLimit2, inflation);
      let limit3 = adjust_(this.uscLimit3, inflation);
      let tax = 0;
      if (taxable > exempt) {
        if (age >= 70 && taxable <= exceed) {
          tax += this.uscRate1 * Math.min(taxable, limit1);
          taxable -= limit1;
          tax += this.uscRate2 * Math.max(0, taxable);
        } else {      
          tax += this.uscRate1 * Math.min(taxable, limit1);
          taxable -= limit1;
          tax += this.uscRate2 * Math.max(0, Math.min(taxable, limit2));
          taxable -= limit2;
          tax += this.uscRate3 * Math.max(0, Math.min(taxable, limit3));
          taxable -= limit3;
          tax += this.uscRate4 * Math.max(0, taxable);
        }
      }
      this.usc += tax;
    }
  }
  
  computeCGT() {
    let tax = 0;
    let taxable = -adjust_(this.cgtTaxRelief, inflation); // capital gains tax relief
    // go through the gains from the highest taxed to the least taxed, so that the credit has more impact
    for (let [taxRate, gains] of Object.entries(this.gains).sort((a,b) => b[0].localeCompare(a[0]))) {
      taxable += gains;
      tax += Math.max(taxable * taxRate, 0);
    }
    this.cgt = tax;
  }
    
}
