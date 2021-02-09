var age, year, phase, inflation, periods, row, success;
var revenue, realEstate, stockGrowthOverride;
var netIncome, expenses, savings, targetCash, cashWithdraw, cashDeficit;
var incomeStatePension, incomePrivatePension, incomeEtfRent, incomeTrustRent;
var cash, etf, trust, pension, dataSheet, statusCell;
var Events, Year, Age, IncomeSalaries, IncomeRSUs, IncomeRentals, IncomePrivatePension;
var IncomeStatePension, IncomeEtfRent, IncomeTrustRent, IncomeCash, IT, PRSI, USC, CGT;
var NetIncome, Expenses, Savings, PensionContribution, Cash, RealEstateCapital, EtfCapital;
var TrustCapital, PensionFund, Worth;
 

const Phases = {
  growth: 'growth',
  lumpSum: 'lumpSum',
  retired: 'retired'
}

function run() {

  let spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let datasheet = spreadsheet.getSheetByName("Data");

  statusCell = spreadsheet.getRangeByName("Progress").getCell(1, 1);
  statusCell.setBackground("#E0E0E0")
  statusCell.setValue("Initializing");
  SpreadsheetApp.flush();

  let startingAge = spreadsheet.getRangeByName("StartingAge").getValue();
  let targetAge = spreadsheet.getRangeByName("TargetAge").getValue();
  let initialSavings = spreadsheet.getRangeByName("InitialSavings").getValue();
  let initialPension = spreadsheet.getRangeByName("InitialPension").getValue();
  let initialETFs = spreadsheet.getRangeByName("InitialETFs").getValue();
  let initialTrusts = spreadsheet.getRangeByName("InitialTrusts").getValue();

  let retirementAge = spreadsheet.getRangeByName("RetirementAge").getValue();
  let emergencyStash = spreadsheet.getRangeByName("EmergencyStash").getValue();
  let pensionPercentage = spreadsheet.getRangeByName("PensionContributionPercentage").getValue();
  let statePensionWeekly = spreadsheet.getRangeByName("StatePensionWeekly").getValue();

  let growthRatePension = spreadsheet.getRangeByName("PensionGrowthRate").getValue();
  let growthDevPension = spreadsheet.getRangeByName("PensionGrowthStdDev").getValue();
  let growthRateETF = spreadsheet.getRangeByName("EtfGrowthRate").getValue();
  let growthDevETF = spreadsheet.getRangeByName("EtfGrowthStdDev").getValue();
  let growthRateTrust = spreadsheet.getRangeByName("TrustGrowthRate").getValue();
  let growthDevTrust = spreadsheet.getRangeByName("TrustGrowthStdDev").getValue();
  inflation = spreadsheet.getRangeByName("Inflation").getValue();

  let etfAllocation = spreadsheet.getRangeByName("EtfAllocation").getValue();
  let trustAllocation = spreadsheet.getRangeByName("TrustAllocation").getValue();

  let priorityCash = spreadsheet.getRangeByName("Priorities").getCell(1, 2).getValue();
  let priorityPension = spreadsheet.getRangeByName("Priorities").getCell(2, 2).getValue();
  let priorityEtf = spreadsheet.getRangeByName("Priorities").getCell(3, 2).getValue();
  let priorityTrust = spreadsheet.getRangeByName("Priorities").getCell(4, 2).getValue();

  incomeTaxBracket = spreadsheet.getRangeByName("IncomeTaxBracket").getValue();
  personalTaxCredit = spreadsheet.getRangeByName("PersonalTaxCredit").getValue();

  let minPrivatePensionRetirementAge = 50;
  let minOccupationalPensionRetirementAge = 60;
  let statePensionQualifyingAge = 68;
  let statePensionIncreaseAge = 80;
  let statePensionIncreaseAmount = 10;

  let simulationRuns = 5000;

  let errors = false;
  spreadsheet.getRangeByName("Parameters").setBackground("#ffffff");
  spreadsheet.getRangeByName("Parameters").clearNote();

  if (retirementAge < minOccupationalPensionRetirementAge) {
    spreadsheet.getRangeByName("RetirementAge").setNote("Warning: Only occupational pension schemes allow retirement before age 60.");
  }
  if (retirementAge < minPrivatePensionRetirementAge) {
    spreadsheet.getRangeByName("RetirementAge").setNote("Warning: Private pensions don't normally allow retirement before age 50.");
  }

  if (etfAllocation + trustAllocation > 1) {
    spreadsheet.getRangeByName("EtfAllocation").setBackground("#ffe066");
    spreadsheet.getRangeByName("TrustAllocation").setBackground("#ffe066");
    spreadsheet.getRangeByName("EtfAllocation").setNote("ETF + Trust allocations can't exceed 100%");
    errors = true;
  }

  Events = spreadsheet.getRangeByName("Events");
  Year = spreadsheet.getRangeByName("Year");
  Age = spreadsheet.getRangeByName("Age");
  IncomeSalaries = spreadsheet.getRangeByName("Salary");
  IncomeRSUs = spreadsheet.getRangeByName("RSUs");
  IncomeRentals = spreadsheet.getRangeByName("Rental");
  IncomePrivatePension = spreadsheet.getRangeByName("PrivatePension");
  IncomeStatePension = spreadsheet.getRangeByName("StatePension");
  IncomeEtfRent = spreadsheet.getRangeByName("EtfRent");
  IncomeTrustRent = spreadsheet.getRangeByName("TrustRent");
  IncomeCash = spreadsheet.getRangeByName("IncomeCash");
  IT = spreadsheet.getRangeByName("IT");
  PRSI = spreadsheet.getRangeByName("PRSI");
  USC = spreadsheet.getRangeByName("USC");
  CGT = spreadsheet.getRangeByName("CGT");
  NetIncome = spreadsheet.getRangeByName("NetIncome");
  Expenses = spreadsheet.getRangeByName("Expenses");
  Savings = spreadsheet.getRangeByName("Savings");
  PensionContribution = spreadsheet.getRangeByName("PensionContribution");
  Cash = spreadsheet.getRangeByName("Cash");
  RealEstateCapital = spreadsheet.getRangeByName("RealEstate");
  EtfCapital = spreadsheet.getRangeByName("EtfCapital");
  TrustCapital = spreadsheet.getRangeByName("TrustCapital");
  PensionFund = spreadsheet.getRangeByName("PensionFund");
  Worth = spreadsheet.getRangeByName("Worth");

  // Read events from the parameters sheet
  let events = [];
  Events.setBackground("#ffffff")
  Events.clearNote();
  for (let i = 1; i <= Events.getHeight(); i++) {
    let name = Events.getCell(i, 1).getValue();
    let pos = name.indexOf(":");
    if (pos < 0) {
      if (name === "") break;
      Events.getCell(i, 1).setNote("Invalid event format: missing colon.");
      Events.getCell(i, 1).setBackground("#ffe066");
      errors = true;
      break;
    }
    let type = name.substr(0, pos);
    let valid = { "RI": "Rental Income", "SI": "Salary Income", "UI": "RSU Income", "FI" : "Tax-free Income", "E": "Expense", "R": "Real Estate", "M": "Mortgage", "SM": "Stock Market" };
    if (!valid.hasOwnProperty(type)) {
      Events.getCell(i, 1).setNote("Invalid event type. Valid types are: " + Object.keys(valid).map(key => { return key + " (" + valid[key] + ")" }).join(", "));
      Events.getCell(i, 1).setBackground("#ffe066");
      errors = true;
      break;
    }
    let id = name.substr(pos + 1);
    let amount = Events.getCell(i, 2).isBlank() ? 0 : Events.getCell(i, 2).getValue();
    let fromAge = Events.getCell(i, 3).isBlank() ? 0 : Events.getCell(i, 3).getValue();
    let toAge = Events.getCell(i, 4).isBlank() ? 999 : Events.getCell(i, 4).getValue();
    let rate = Events.getCell(i, 5).isBlank() ? undefined : Events.getCell(i, 5).getValue();
    let extra = Events.getCell(i, 6).isBlank() ? 0 : Events.getCell(i, 6).getValue();
    events.push(new Event(type, id, amount, fromAge, toAge, rate, extra));
  }

  // Validate that mortgage events have their corresponding purchase event
  for (let m = 0; m < events.length; m++) {
    if (events[m].type === 'M') {
      let found = false;
      for (let p = 0; p < events.length; p++) {
        if (events[p].type === 'R' && events[p].id === events[m].id) {
          found = true;
          if (events[p].fromAge !== events[m].fromAge) {
            Events.getCell(m + 1, 3).setNote("The mortgage (M) and purchase (R) events for a property should have the same starting age.");
            Events.getCell(m + 1, 3).setBackground("#ffe066");
            Events.getCell(p + 1, 3).setBackground("#ffe066");
            errors = true;
            continue;
          }
          if (events[m].toAge > events[p].toAge) {
            Events.getCell(m + 1, 4).setNote("The mortgage should not continure after the property is sold.");
            Events.getCell(m + 1, 4).setBackground("#ffe066");
            Events.getCell(p + 1, 4).setBackground("#ffe066");
            errors = true;
            continue;
          }
        }
      }
      if (!found) {
        Events.getCell(m + 1, 1).setNote("Couldn't find a purchase (R) event for the property '" + events[m].id + "'.");
        Events.getCell(m + 1, 1).setBackground("#ffe066");
        errors = true;
        continue;
      }
    }
  }

  if (errors) {
    statusCell.setValue("Check errors");
    statusCell.setBackground("#ffe066");
    return;
  }


  dataSheet = [];

  let montecarlo = (growthDevPension > 0 || growthDevETF > 0 || growthDevTrust > 0);
  let runs = (montecarlo ? simulationRuns : 1);
  let successes = 0;
  let failedAt = 0;
  let failedAtAccum = 0;
  let failureCount = 0;

  statusCell.setValue("Running");
  SpreadsheetApp.flush();

  for (let run = 0; run < runs; run++) {

    revenue = new Revenue();
    pension = new Pension(growthRatePension, growthDevPension);
    etf = new ETF(growthRateETF, growthDevETF);
    trust = new InvestmentTrust(growthRateTrust, growthDevTrust);
    if (initialPension > 0) pension.buy(initialPension);
    if (initialETFs > 0) etf.buy(initialETFs);
    if (initialTrusts > 0) trust.buy(initialTrusts);

    periods = 0;
    success = true;
    stockGrowthOverride = undefined;
    realEstate = new RealEstate();

    // buy properties that were bought before the startingAge
    let props = new Map();
    for (let i = 0; i < events.length; i++) {
      let event = events[i];
      switch (event.type) {
        case 'R':
          if (event.fromAge < startingAge) {
            props.set(event.id,
              {
                "fromAge": event.fromAge,
                "property": realEstate.buy(event.id, event.amount, event.rate)
              });
          }
          break;
        case 'M':
          if (event.fromAge < startingAge) {
            props.set(event.id,
              {
                "fromAge": event.fromAge,
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
      for (let y = data.fromAge; y < startingAge; y++) {
        data.property.addYear();
      }
    }

    // Initialize first row

    age = startingAge - 1;
    year = new Date().getFullYear() - 1;
    phase = Phases.growth;
    cash = initialSavings;
    failedAt = 0
    row = 0;

    while (age < 100) {

      row++;
      year++;
      age++;
      periods = row - 1;

      incomeSalaries = 0;
      incomeShares = 0;
      incomeRentals = 0;
      incomePrivatePension = 0;
      incomeStatePension = 0;
      incomeEtfRent = 0;
      incomeTrustRent = 0;
      incomeTaxFree = 0;
      pensionContribution = 0;
      cashDeficit = 0;
      cashWithdraw = 0;
      savings = 0;


      revenue.reset();
      etf.addYear();
      trust.addYear();
      pension.addYear();
      realEstate.addYear();

      // console.log("========= Age: "+age+" =========");

      // Private Pension

      if (age === retirementAge) {
        cash += pension.getLumpsum();
        phase = Phases.lumpSum;
      }

      if (phase !== Phases.growth) {
        incomePrivatePension += pension.drawdown();
      }

      // State Pension
      if (age >= statePensionQualifyingAge) {
        incomeStatePension = 52 * adjust_(statePensionWeekly, inflation);
        if (age >= statePensionIncreaseAge) {
          incomeStatePension += 52 * adjust_(statePensionIncreaseAmount, inflation);
        }
      }
      revenue.declareStatePensionIncome(incomeStatePension);

      // Cash Flow & Events

      expenses = 0;
      for (let i = 0; i < events.length; i++) {
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
              pensionContribution += totalContrib;
              pension.buy(totalContrib);
              revenue.declareSalaryIncome(amount, contribRate);
            }
            break;
          case 'UI': // RSU income
            if (age >= event.fromAge && age <= event.toAge && amount > 0) {
              incomeShares += amount;
              revenue.declareNonEuSharesIncome(amount);
            }
            break;
          case 'FI': // Tax-free income
            if (age >= event.fromAge && age <= event.toAge && amount > 0) {
              incomeTaxFree += amount;
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
          case 'SM': // Stock Market Growth override to simulate a crash or a bubble (only the growth part of the bubble)
            if (age == event.fromAge) {
              stockGrowthOverride = event.amount / (event.toAge - event.fromAge);
            }
            if (age === event.toAge) {
              stockGrowthOverride = undefined;
            }
            break;
          default:
            break;
        }
      }

      netIncome = revenue.netIncome() + incomeTaxFree;

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
      let invested = 0;
      if (cash > targetCash + 0.001 && incomeSalaries > 0) {
        let surplus = cash - targetCash;
        etf.buy(surplus * etfAllocation);
        trust.buy(surplus * trustAllocation);
        invested = surplus * (etfAllocation + trustAllocation);
        cash -= invested;
      }
      // Any remaining income should be used to top-up the emergency stash
      if (netIncome > expenses + invested && targetCash - cash > 0.001) {
        let addToStash = netIncome - (expenses + invested);
        cash += addToStash;
        expenses += addToStash;
      }

      if (netIncome < expenses - 100 && success) {
        success = false;
        failedAt = age;
        if (failedAt <= targetAge) {
          failedAtAccum += age;
          failureCount += 1;
        }
      }

      // This is used below to hide the deemed disposal tax payments, otherwise they're shown as income.
      let etfTax = (incomeEtfRent + incomeTrustRent + cashWithdraw > 0) ? revenue.cgt * incomeEtfRent / (incomeEtfRent + incomeTrustRent + cashWithdraw) : 0;
      let trustTax = (incomeEtfRent + incomeTrustRent + cashWithdraw > 0) ? revenue.cgt * incomeTrustRent / (incomeEtfRent + incomeTrustRent + cashWithdraw) : 0;

      if (!(row in dataSheet)) {
        dataSheet[row] = { "age": 0, "year": 0, "incomeSalaries": 0, "incomeRSUs": 0, "incomeRentals": 0, "incomePrivatePension": 0, "incomeStatePension": 0, "incomeEtfRent": 0, "incomeTrustRent": 0, "incomeCash": 0, "realEstateCapital": 0, "netIncome": 0, "expenses": 0, "savings": 0, "pensionFund": 0, "cash": 0, "etfCapital": 0, "trustCapital": 0, "pensionContribution": 0, "it": 0, "prsi": 0, "usc": 0, "cgt": 0, "worth": 0 };
      }
      dataSheet[row].age += age;
      dataSheet[row].year += year;
      dataSheet[row].incomeSalaries += incomeSalaries;
      dataSheet[row].incomeRSUs += incomeShares;
      dataSheet[row].incomeRentals += incomeRentals;
      dataSheet[row].incomePrivatePension += incomePrivatePension;
      dataSheet[row].incomeStatePension += incomeStatePension;
      dataSheet[row].incomeEtfRent += Math.max(incomeEtfRent - etfTax, 0);
      dataSheet[row].incomeTrustRent += Math.max(incomeTrustRent - trustTax, 0);
      dataSheet[row].incomeCash += Math.max(cashWithdraw, 0) + incomeTaxFree;
      dataSheet[row].realEstateCapital += realEstate.getTotalValue();
      dataSheet[row].netIncome += netIncome;
      dataSheet[row].expenses += expenses;
      dataSheet[row].savings += savings;
      dataSheet[row].pensionFund += pension.capital();
      dataSheet[row].cash += cash;
      dataSheet[row].etfCapital += etf.capital();
      dataSheet[row].trustCapital += trust.capital();
      dataSheet[row].pensionContribution += pensionContribution;
      dataSheet[row].it += revenue.it;
      dataSheet[row].prsi += revenue.prsi;
      dataSheet[row].usc += revenue.usc;
      dataSheet[row].cgt += revenue.cgt;
      dataSheet[row].worth += realEstate.getTotalValue() + pension.capital() + etf.capital() + trust.capital() + cash;

      if (!montecarlo) {
        updateDataRow(row, (age-startingAge) / (100-startingAge));
      }

    }

    if (success || failedAt > targetAge) {
      successes += 1;
    }

  }

  // Update data sheet 
  if (montecarlo) {   
    for (let i = 1; i <= row; i++) {
      updateDataRow(i, i/row, runs);
    }
  }
  datasheet.getRange(Year.getRow() + row, Year.getColumn(), 100, Worth.getColumn() - Year.getColumn() + 1).clearContent();
  
  //(runs-successes)
  if (montecarlo) {
    let percentSuccess = successes / runs;
    let msg = "Success " + Math.round(1000 * percentSuccess) / 10 + "%";
    // if (failureCount > 0) msg += ", avg fail age " + Math.round(failedAtAccum / failureCount)
    statusCell.setValue(msg);
    let r = between(255, 160, percentSuccess);
    let g = between(128, 255, percentSuccess);
    let b = between(128, 160, percentSuccess);
    statusCell.setBackground(rgbToHex(r, g, b));
  } else {
    if (success || failedAt > targetAge) {
      statusCell.setValue(success ? "Success!" : "Made it to " + failedAt);
      statusCell.setBackground("#9fdf9f")
    } else {
      statusCell.setValue("Failed at age " + failedAt);
      statusCell.setBackground("#ff8080")
    }
  }
  SpreadsheetApp.flush();

}

function updateDataRow(row, progress, scale = 1) {
  Age.getCell(row, 1).setValue(dataSheet[row].age / scale);
  Year.getCell(row, 1).setValue(dataSheet[row].year / scale);
  IncomeSalaries.getCell(row, 1).setValue(dataSheet[row].incomeSalaries / scale);
  IncomeRSUs.getCell(row, 1).setValue(dataSheet[row].incomeRSUs / scale);
  IncomeRentals.getCell(row, 1).setValue(dataSheet[row].incomeRentals / scale);
  IncomePrivatePension.getCell(row, 1).setValue(dataSheet[row].incomePrivatePension / scale);
  IncomeStatePension.getCell(row, 1).setValue(dataSheet[row].incomeStatePension / scale);
  IncomeEtfRent.getCell(row, 1).setValue(dataSheet[row].incomeEtfRent / scale);
  IncomeTrustRent.getCell(row, 1).setValue(dataSheet[row].incomeTrustRent / scale);
  IncomeCash.getCell(row, 1).setValue(dataSheet[row].incomeCash / scale);
  RealEstateCapital.getCell(row, 1).setValue(dataSheet[row].realEstateCapital / scale);
  NetIncome.getCell(row, 1).setValue(dataSheet[row].netIncome / scale);
  Expenses.getCell(row, 1).setValue(dataSheet[row].expenses / scale);
  Savings.getCell(row, 1).setValue(dataSheet[row].savings / scale);
  PensionFund.getCell(row, 1).setValue(dataSheet[row].pensionFund / scale);
  Cash.getCell(row, 1).setValue(dataSheet[row].cash / scale);
  EtfCapital.getCell(row, 1).setValue(dataSheet[row].etfCapital / scale);
  TrustCapital.getCell(row, 1).setValue(dataSheet[row].trustCapital / scale);
  PensionContribution.getCell(row, 1).setValue(dataSheet[row].pensionContribution / scale);
  IT.getCell(row, 1).setValue(dataSheet[row].it / scale);
  PRSI.getCell(row, 1).setValue(dataSheet[row].prsi / scale);
  USC.getCell(row, 1).setValue(dataSheet[row].usc / scale);
  CGT.getCell(row, 1).setValue(dataSheet[row].cgt / scale);
  Worth.getCell(row, 1).setValue(dataSheet[row].worth / scale);
  if (row % 5 === 0) {
    statusCell.setValue("Updating "+Math.round(100 * progress) + "%");
    SpreadsheetApp.flush();
  }
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

// This function assumes fixed rate. If the rate varies each year, the adjustment needs to take into account
// the history of variation, or it needs to take the previous value (not the start value) and apply the latest 
// rate once. Either case would require a rewrite of several parts of the simulator. 
// Since it's used mainly to adjust for inflation, inflation has to remain fixed for now.
function adjust_(value, rate, n = periods) {
  if (rate === undefined) {
    rate = inflation;
  }
  return value * (1 + rate) ** n;
}

function gaussian(mean, stdev, withOverride = true) {
  let u1 = 1 - Math.random();
  let u2 = 1 - Math.random();
  let val = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  if (withOverride && stockGrowthOverride !== undefined) {
    mean = stockGrowthOverride;
  }
  return mean + stdev * val;
}

function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function between(a, b, p) {
  return Math.round(a + (b - a) * p);
}

function onEdit(e) {
  if (e.range.getA1Notation() == 'F2') {
    e.range.setValue("");
    run()
  }
}