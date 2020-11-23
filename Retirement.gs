var age, year, phase, inflation, periods;
var revenue, realEstate
var netIncome, expenses, savings, targetCash, cashWithdraw, cashDeficit;
var incomeStatePension, incomePrivatePension, incomeEtfRent, incomeTrustRent;
var cash, etf, trust, pension;

const Phases = {
  growth: 'growth',
  lumpSum: 'lumpSum',
  retired: 'retired'
}

function run() {
  
  let spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let datasheet = spreadsheet.getSheetByName("Data");

  let progress = spreadsheet.getRangeByName("Progress").getCell(1,1);
  progress.setBackground("#E0E0E0")
  progress.setValue("Initializing");

  let startingAge = spreadsheet.getRangeByName("StartingAge").getValue();
  let initialSavings = spreadsheet.getRangeByName("InitialSavings").getValue();
  let initialPension = spreadsheet.getRangeByName("InitialPension").getValue();
  let initialETFs = spreadsheet.getRangeByName("InitialETFs").getValue();
  let initialTrusts = spreadsheet.getRangeByName("InitialTrusts").getValue();

  let retirementAge = spreadsheet.getRangeByName("RetirementAge").getValue();
  let emergencyStash = spreadsheet.getRangeByName("EmergencyStash").getValue();
  let pensionPercentage = spreadsheet.getRangeByName("PensionContributionPercentage").getValue();
  let statePensionWeekly = spreadsheet.getRangeByName("StatePensionWeekly").getValue();
  let growthRatePension = spreadsheet.getRangeByName("PensionGrowthRate").getValue();
  let growthRateETF = spreadsheet.getRangeByName("EtfGrowthRate").getValue();

  let growthRateTrust = spreadsheet.getRangeByName("TrustGrowthRate").getValue();
  let etfAllocation = spreadsheet.getRangeByName("EtfAllocation").getValue();
  let trustAllocation = spreadsheet.getRangeByName("TrustAllocation").getValue();
  inflation = spreadsheet.getRangeByName("Inflation").getValue();

  let priorityCash = spreadsheet.getRangeByName("Priorities").getCell(1,2).getValue();
  let priorityPension = spreadsheet.getRangeByName("Priorities").getCell(2,2).getValue();
  let priorityEtf = spreadsheet.getRangeByName("Priorities").getCell(3,2).getValue();
  let priorityTrust = spreadsheet.getRangeByName("Priorities").getCell(4,2).getValue();

  let errors = false;
  spreadsheet.getRangeByName("Parameters").setBackground("#ffffff");
  spreadsheet.getRangeByName("Parameters").clearNote();

  if (retirementAge < 60) {
    if (retirementAge < 50) {
      spreadsheet.getRangeByName("RetirementAge").setNote("Warning: Private pensions don't normally allow retirement before age 50.");
    } else {
      spreadsheet.getRangeByName("RetirementAge").setNote("Warning: Only occupational pension schemes allow retirement before age 60.");
    }
  }
  
  if (etfAllocation + trustAllocation > 1) {
    spreadsheet.getRangeByName("EtfAllocation").setBackground("#ffe066");
    spreadsheet.getRangeByName("TrustAllocation").setBackground("#ffe066");
    spreadsheet.getRangeByName("EtfAllocation").setNote("ETF + Trust allocations can't exceed 100%");
    errors = true;
  }
  
  let Events = spreadsheet.getRangeByName("Events");
  let Year = spreadsheet.getRangeByName("Year");
  let Age = spreadsheet.getRangeByName("Age");
  let IncomeSalaries = spreadsheet.getRangeByName("Salary");
  let IncomeRSUs = spreadsheet.getRangeByName("RSUs");
  let IncomeRentals = spreadsheet.getRangeByName("Rental");
  let IncomePrivatePension = spreadsheet.getRangeByName("PrivatePension");
  let IncomeStatePension = spreadsheet.getRangeByName("StatePension");
  let IncomeEtfRent = spreadsheet.getRangeByName("EtfRent");
  let IncomeTrustRent = spreadsheet.getRangeByName("TrustRent");
  let IncomeCash = spreadsheet.getRangeByName("IncomeCash");
  let PAYE = spreadsheet.getRangeByName("PAYE");
  let PRSI = spreadsheet.getRangeByName("PRSI");
  let USC = spreadsheet.getRangeByName("USC");
  let CGT = spreadsheet.getRangeByName("CGT");
  let NetIncome = spreadsheet.getRangeByName("NetIncome");
  let Expenses = spreadsheet.getRangeByName("Expenses");
  let Savings = spreadsheet.getRangeByName("Savings");
  let PensionContribution = spreadsheet.getRangeByName("PensionContribution");
  let Cash = spreadsheet.getRangeByName("Cash");
  let RealEstateCapital = spreadsheet.getRangeByName("RealEstate");
  let EtfCapital = spreadsheet.getRangeByName("EtfCapital");
  let TrustCapital = spreadsheet.getRangeByName("TrustCapital");
  let PensionFund = spreadsheet.getRangeByName("PensionFund");
  let Worth = spreadsheet.getRangeByName("Worth");

  revenue = new Revenue();
  pension = new Pension(growthRatePension);
  etf = new ETF(growthRateETF);
  trust = new InvestmentTrust(growthRateTrust);
  if (initialPension > 0) pension.buy(initialPension);
  if (initialETFs > 0) etf.buy(initialETFs);
  if (initialTrusts > 0) trust.buy(initialTrusts);

  realEstate = new RealEstate();
  periods = 0;
  let success = true;
  let failedAt = 0;
  
  // Read events from the parameters sheet
  events = [];
  Events.setBackground("#ffffff")
  Events.clearNote();
  for (let i = 1; i <= Events.getHeight(); i++) {
    let name = Events.getCell(i,1).getValue();
    let pos = name.indexOf(":");
    if (pos < 0) {
      if (name === "") break;
      Events.getCell(i,1).setNote("Invalid event format: missing colon.");
      Events.getCell(i,1).setBackground("#ffe066");
      errors = true;
      break;
    }
    let type = name.substr(0,pos);
    let valid = {"RI":"Rental Income","SI":"Salary Income","UI":"RSU Income","E":"Expense","R":"Real Estate","M":"Mortgage"};
    if (!valid.hasOwnProperty(type)) {
      Events.getCell(i,1).setNote("Invalid event type. Valid types are: "+Object.keys(valid).map(key => {return key+" ("+valid[key]+")"}).join(", "));
      Events.getCell(i,1).setBackground("#ffe066");
      errors = true;
      break;
    }
    let id = name.substr(pos+1);
    let amount = Events.getCell(i,2).isBlank() ? 0 : Events.getCell(i,2).getValue();
    let fromAge = Events.getCell(i,3).isBlank() ? 0 : Events.getCell(i,3).getValue();
    let toAge = Events.getCell(i,4).isBlank() ? 999 : Events.getCell(i,4).getValue();
    let rate = Events.getCell(i,5).isBlank() ? inflation : Events.getCell(i,5).getValue();
    let extra = Events.getCell(i,6).isBlank() ? 0 : Events.getCell(i,6).getValue();
    events.push(new Event(type, id, amount, fromAge, toAge, rate, extra));
  }

  // Validate that mortgage events have their corresponding purchase event
  for (let m=0; m<events.length; m++) {
    if (events[m].type === 'M') {
      let found = false;
      for (let p=0; p<events.length; p++) {
        if (events[p].type === 'R' && events[p].id === events[m].id) {
          found = true;
          if (events[p].fromAge !== events[m].fromAge) {
            Events.getCell(m+1,3).setNote("The mortgage (M) and purchase (R) events for a property should have the same starting age.");
            Events.getCell(m+1,3).setBackground("#ffe066");
            Events.getCell(p+1,3).setBackground("#ffe066");
            errors = true;
            continue;
          }
          if (events[m].toAge > events[p].toAge) {
            Events.getCell(m+1,4).setNote("The mortgage should not continure after the property is sold.");
            Events.getCell(m+1,4).setBackground("#ffe066");
            Events.getCell(p+1,4).setBackground("#ffe066");
            errors = true;
            continue;
          }
        }
      }
      if (!found) {
        Events.getCell(m+1,1).setNote("Couldn't find a purchase (R) event for the property '" + events[m].id + "'.");
        Events.getCell(m+1,1).setBackground("#ffe066");
        errors = true;
        continue;
      }
    }
  }
  
  if (errors) {
    progress.setValue("Check errors");
    progress.setBackground("#ffe066");
    return;
  }

  // buy properties that were bought before the startingAge
  let props = new Map();
  for (let i=0; i<events.length; i++) {
    let event = events[i];
    switch (event.type) {
      case 'R':
        if (event.fromAge < startingAge) {
          props.set(event.id, 
                    {"fromAge": event.fromAge, 
                     "property": realEstate.buy(event.id, event.amount, event.rate)
                    });
        }
        break;
      case 'M':
        if (event.fromAge < startingAge) {
          props.set(event.id, 
                    {"fromAge": event.fromAge, 
                     "property": realEstate.mortgage(event.id, event.toAge - event.fromAge, event.rate, event.amount)
                    });
        }
        break;
      default:
        break;
    }
  }
  
  // let years go by, repaying mortgage, until the starting age
  for (let [id, data] of props) {
    for (let y=data.fromAge; y<startingAge; y++) {
      data.property.addYear();
    }
  }
  
  // Initialize first row

  age = startingAge - 1;
  year = new Date().getFullYear() - 1;
  phase = Phases.growth;
  cash = initialSavings;
  let row = 0;
 
  while (age < 100) {

    row++;
    year++;
    age++;
    periods = row-1;

    progress.setValue(Math.round(100 * (age-startingAge) / (100-startingAge)) + "%");

    incomeSalaries = 0;
    incomeShares = 0;
    incomeRentals = 0;
    incomePrivatePension = 0;
    incomeStatePension = 0;
    incomeEtfRent = 0;
    incomeTrustRent = 0;
    pensionContribution = 0;
    cashDeficit = 0;
    cashWithdraw = 0;
    savings = 0;

    
    revenue.reset();
    etf.addYear();
    trust.addYear();
    pension.addYear();
    realEstate.addYear();

//    console.log("========= Age: "+age+" =========");

    // Private Pension
    
    if (age === retirementAge) {
      cash += pension.getLumpsum();
      phase = Phases.lumpSum;
    }

    if (phase !== Phases.growth) {
      incomePrivatePension += pension.drawdown();
    }

    // State Pension
    
    if (age >= 68) {
      incomeStatePension = 52 * adjust_(statePensionWeekly, inflation);
      if (age >= 80) {
        incomeStatePension += 52 * adjust_(10, inflation);
      }
    }
    revenue.declareStatePensionIncome(incomeStatePension);

    
    // Cash Flow & Events
    
    expenses = 0;
    for (let i=0; i<events.length; i++) {
      let event = events[i];
      let amount = adjust_(event.amount, event.rate);
      switch (event.type) {
        case 'RI': // Rental income
          if (age >= event.fromAge && age <= event.toAge && amount > 0) {
            incomeRentals += amount;
            revenue.declareOtherIncome(amount);
          }
          break;
        case 'SI': // Salary income
          if (age >= event.fromAge && age <= event.toAge && amount > 0) {
            incomeSalaries += amount;
            let contribRate = pensionPercentage * ((age < 30) ? 0.15 : (age < 40) ? 0.20 : (age < 50) ? 0.25 : (age < 55) ? 0.30 : (age < 60) ? 0.35 : 0.40);
            let companyMatch = Math.min(event.extra, contribRate);
            let personalContrib = contribRate * amount;
            let companyContrib = companyMatch * amount;
            let totalContrib = personalContrib + companyContrib;
            let maxRelief = contribRate * Math.min(amount, adjust_(115000,inflation))
            pensionContribution += totalContrib;
            pension.buy(totalContrib);
            revenue.declareSalaryIncome(amount - maxRelief);
         }
          break;
        case 'UI': // RSU income
          if (age >= event.fromAge && age <= event.toAge && amount > 0) {
            incomeShares += amount;
            revenue.declareNonEuSharesIncome(amount);
          }
          break;
        case 'E': // Expenses
          if (age >= event.fromAge && age <= event.toAge) {
            expenses += amount;
          }
          break;
        case 'M': // Mortgage
          if (age == event.fromAge) {
            realEstate.mortgage(event.id, event.toAge - event.fromAge, event.rate, amount);
//            console.log("Borrowed "+Math.round(realEstate.properties[event.id].borrowed)+" on a "+(event.toAge - event.fromAge)+"-year "+(event.rate*100)+"% mortgage for property ["+event.id+"] paying "+Math.round(amount)+"/year");
          }
          if (age >= event.fromAge && age < event.toAge) {
            expenses += realEstate.getPayment(event.id); // not adjusted once mortgage starts, assuming fixed rate
//            console.log("Mortgage payment "+realEstate.getPayment(event.id)+" for property ["+event.id+"] ("+(realEstate.properties[event.id].paymentsMade+1)+" of "+realEstate.properties[event.id].terms+")");
          }
          break;
        case 'R': // Real estate
          // purchase
          if (age === event.fromAge) {
            realEstate.buy(event.id, amount, event.rate);
            expenses += amount;
//            console.log("Buy property ["+event.id+"] with "+Math.round(amount)+"  downpayment (valued "+Math.round(realEstate.getValue(event.id))+")");
          }
          // sale
          if (age === event.toAge) { 
//            console.log("Sell property ["+event.id+"] for "+Math.round(realEstate.getValue(event.id)));
            cash += realEstate.sell(event.id)
          }
          break;
        default:
          break;
      }
    }
        
    netIncome = revenue.netIncome();
    
    if (netIncome > expenses) {
      savings = netIncome - expenses;
      cash += savings;
    }
    targetCash = adjust_(emergencyStash, inflation);
    if (phase == Phases.lumpSum && cash < targetCash && age >= retirementAge) {
      phase = Phases.retired;
    }
    if (cash < targetCash) {
      cashDeficit = targetCash - cash;
    }
    
    // If deficit, drawdown from where needed
    if (expenses > netIncome) {
      switch (phase) {
        case Phases.growth:
          withdraw_(1, 0, 2, 3); // cash -> etf -> trust
          break;
        case Phases.lumpSum:
          withdraw_(1, 4, 2, 3); // cash -> etf -> trust -> pension
          break;
        case Phases.retired:
          withdraw_(priorityCash, priorityPension, priorityEtf, priorityTrust);  // taken from user configuration
          break;
      }
    }

    // If extra cash, invest
    if (cash > targetCash && incomeSalaries > 0) {
      let surplus = cash - targetCash;
      etf.buy(surplus * etfAllocation);
      trust.buy(surplus * trustAllocation);
//      console.log("Bought "+Math.round(surplus * etfAllocation)+" etf, "+Math.round(surplus * trustAllocation)+ " trust");
      cash -= surplus * (etfAllocation + trustAllocation);
    }
    if (cash < targetCash && netIncome > expenses) {
      cash += netIncome - expenses;
    }
    
    if (netIncome < expenses - 100 && success) {
      success = false;
      failedAt = age;
    }

    // This is used below to hide the deemed disposal tax payments, otherwise they're shown as income.
    let etfTax = (incomeEtfRent + incomeTrustRent + cashWithdraw > 0) ? revenue.cgt * incomeEtfRent / (incomeEtfRent + incomeTrustRent + cashWithdraw) : 0;
    
    // Update data sheet    
    Age.getCell(row,1).setValue(age);
    Year.getCell(row,1).setValue(year);
    IncomeSalaries.getCell(row,1).setValue(incomeSalaries);
    IncomeRSUs.getCell(row,1).setValue(incomeShares);
    IncomeRentals.getCell(row,1).setValue(incomeRentals);
    IncomePrivatePension.getCell(row,1).setValue(incomePrivatePension);
    IncomeStatePension.getCell(row,1).setValue(incomeStatePension);
    IncomeEtfRent.getCell(row,1).setValue(Math.max(incomeEtfRent - etfTax, 0));
    IncomeTrustRent.getCell(row,1).setValue(incomeTrustRent);
    IncomeCash.getCell(row,1).setValue(Math.max(cashWithdraw,0));
    RealEstateCapital.getCell(row,1).setValue(realEstate.getValue());
    NetIncome.getCell(row,1).setValue(netIncome);
    Expenses.getCell(row,1).setValue(expenses);
    Savings.getCell(row,1).setValue(savings);
    PensionFund.getCell(row,1).setValue(pension.capital());
    Cash.getCell(row,1).setValue(cash);
    EtfCapital.getCell(row,1).setValue(etf.capital());
    TrustCapital.getCell(row,1).setValue(trust.capital());
    PensionContribution.getCell(row,1).setValue(pensionContribution);
    PAYE.getCell(row,1).setValue(revenue.paye);
    PRSI.getCell(row,1).setValue(revenue.prsi);
    USC.getCell(row,1).setValue(revenue.usc);
    CGT.getCell(row,1).setValue(revenue.cgt);
    Worth.getCell(row,1).setValue(realEstate.getValue() + pension.capital() + etf.capital() + trust.capital() + cash);

    if (row % 4 === 0) SpreadsheetApp.flush();
  }
  datasheet.getRange(Year.getRow()+row, Year.getColumn(), 100, Worth.getColumn()-Year.getColumn()+1).clearContent();

  if (success || failedAt > 90) {
    progress.setValue(success ? "Success!" : "Made it to "+failedAt);
    progress.setBackground("#9fdf9f")
  } else {
    progress.setValue("Failed at age "+failedAt);
    progress.setBackground("#ff8080")
  }
  SpreadsheetApp.flush();

}

// Get more money from: cash, pension, etfs, trusts, 
// in the specified order of priority:
// - fromX = 0 (don't use X)
// - fromX = 1 (use X first)
// - fromX = 2 (use X if first option not enough)
// - fromX = 3 (use X if first and second options not enough)
//
function withdraw_(fromCash, fromPension, fromEtf, fromTrust) {
  cashWithdraw = 0;
  for (let option = 1; option <= 4; option++) {
    while (expenses + cashDeficit - netIncome > 0.75) {
      let keepTrying = false;
      let needed = expenses + cashDeficit - netIncome;
      let etfCapital = etf.capital();
      let trustCapital = trust.capital();
      let pensionCapital = pension.capital();
//      if (option === 1) console.log("Need "+Math.round(needed)+" (netIncome="+Math.round(netIncome)+" < Expenses="+Math.round(expenses)+"). Funds: cash="+Math.round(cash)+" (deficit="+Math.round(cashDeficit)+") etf="+Math.round(etfCapital)+" trust="+Math.round(trustCapital)+" pension="+Math.round(pensionCapital));
      switch (option) {
        case fromCash:
          if (cash > 0) {
            cashWithdraw = Math.min(cash, needed);
            cash -= cashWithdraw;
//            console.log("... Withdrawing "+Math.round(cashWithdraw)+" from cash savings");
          };
          break;
        case fromPension:
          if (pensionCapital > 0) {
            let withdraw = Math.min(pensionCapital, needed);
            incomePrivatePension += pension.sell(withdraw);
//            console.log("... Withdrawing "+Math.round(withdraw)+" from pension");
            keepTrying = true;
          }
          break;
        case fromEtf:
          if (etfCapital > 0) {
            let withdraw = Math.min(etfCapital, needed);
            incomeEtfRent += etf.sell(withdraw);
//            console.log("... Withdrawing "+Math.round(withdraw)+" from etf");
            keepTrying = true;
          }
          break;
        case fromTrust:
          if (trustCapital > 0) {
            let withdraw = Math.min(trustCapital, needed);
            incomeTrustRent += trust.sell(withdraw);
//            console.log("... Withdrawing "+Math.round(withdraw)+" from trust");
            keepTrying = true;
          }
          break;
        default:
      }
      netIncome = cashWithdraw + revenue.netIncome();
      if (keepTrying == false) {
        break;
      }
    }
  }
}

function adjust_(value, rate, n = periods) {
  return value * (1+rate)**n;
}

