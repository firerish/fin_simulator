class Equity {

  constructor(taxRate, growth, stdev=0) {
    this.taxRate = taxRate;
    this.growth = growth;
    this.stdev = stdev;
    this.portfolio = [];
  }

  buy(amountToBuy) {
    this.portfolio.push({amount: amountToBuy, interest: 0, age: 0});
  }
  
  declareRevenue(income, gains) {
    revenue.declareInvestmentIncome(income);
    revenue.declareInvestmentGains(gains, this.taxRate);
  }
  
  sell(amountToSell) {
    let sold = 0;
    let gains = 0;
    while (amountToSell > 0 && this.portfolio.length > 0) {
      let sale = 0;
      if (amountToSell >= this.portfolio[0].amount + this.portfolio[0].interest) {
        sale = this.portfolio[0].amount + this.portfolio[0].interest;
        sold += sale;
        gains += this.portfolio[0].interest;
        this.portfolio.shift();
      } else {
        sale = amountToSell;
        sold += amountToSell;
        let fraction = amountToSell / (this.portfolio[0].amount + this.portfolio[0].interest);
        gains += fraction * this.portfolio[0].interest;
        this.portfolio[0].amount = (1 - fraction) * this.portfolio[0].amount;
        this.portfolio[0].interest = (1 - fraction) * this.portfolio[0].interest;
      }
      amountToSell -= sale;
    }
    this.declareRevenue(sold, gains);
    return sold;
  }
  
  capital() {
    let sum = 0;
    for (let i = 0; i < this.portfolio.length; i++) {
      sum += this.portfolio[i].amount + this.portfolio[i].interest;
    }
    return sum;
  }
    
  addYear() {
    // Accumulate interests
    for (let i = 0; i < this.portfolio.length; i++) {
      this.portfolio[i].interest += (this.portfolio[i].amount + this.portfolio[i].interest) * gaussian(this.growth,this.stdev);
      this.portfolio[i].age++;
    }
  }

}


class ETF extends Equity {
  
  constructor(growth, stdev=0) {
    super(0.41, growth, stdev);
  }
  
  addYear() {
    super.addYear();
    // pay deemed disposal taxes for ETFs aged multiple of 8 years
    for (let i = 0; i < this.portfolio.length; i++) {
      if (this.portfolio[i].age % 8 === 0) {
        let gains = this.portfolio[i].interest;
        this.portfolio[i].amount += gains;
        this.portfolio[i].interest = 0;
        this.portfolio[i].age = 0;
        revenue.declareInvestmentGains(gains, this.taxRate);
      }
    }
  }

}


class InvestmentTrust extends Equity {

  constructor(growth, stdev=0) {
    super(0.33, growth, stdev);
  }

}


class Pension extends Equity {

  constructor(growth, stdev=0) {
    super(0, growth, stdev);
    this.declare = true;
  }

  declareRevenue(income, gains) {
    if (this.declare) {
      revenue.declarePrivatePensionIncome(income);
    }
  }
  
  getLumpsum() {
    this.declare = false;
    let amount = this.sell(this.capital() * 0.25);
    this.declare = true;
    return amount;
  }
  
  drawdown() {
    let minimumDrawdown = (age < 61) ? 0 : (age < 71) ? 0.04 : 0.05;
    return this.sell(this.capital() * minimumDrawdown);
  }

}

