## User Guide

***Disclaimer**: I am not an accountant, or a financial advisor, or a tax expert of any kind. I do not claim that this spreadsheet accounts for all situations or taxes, or that its forecasts are accurate. This is not a professionally developed financial planning tool. I developed it for my own use, based on my own research, and it likely has errors and omissions. I recommend doing your own research and consulting with professional tax and financial advisors on your particular situation.
Please let me know if you find any issues. I'm [/u/firerish](http://www.reddit.com/u/firerish) on reddit.*
											
### Introduction

The main point of this exercise is to experiment with different ways to use your money and see how they play out in your retirement. You can let it sit in your bank account and lose buying power to inflation, or you may invest it in real estate, in the stock market, or in pension funds. This simulator assumes a constant yearly growth rate for things like inflation, investments, and other factors. You specify those rates so you can see what happens if inflation is higher, investments grow slower, etc. I recommend entering conservative figures. Use the worst plausible growth rates to stress test your scenarios. My next project is to run scenarios based on historical data, but for now it's up to you to come up with realistic growth rates (hint: the past ten years are not the norm). Also note that I'm not using the usual "safe withdrawal rate". Instead, the simulation takes as much as it needs from various funds to pay for the specified expenses. If it runs out of money before age 90, the scenario failed.

### Before you start

- Before you do anything else, make your own copy of this spreadsheet. You won't be able to run your own scenarios otherwise.
- I plan to fix bugs and add new features for some time. Come back here every once in a while to check the version (and the change log at the bottom of this page).
- This spreadsheet runs on Google App Scripts, so in order to run it you need to give it permission. Google will walk you through that process the first time you hit "run". Be aware that it will say that you're entering an insecure page (this is Google making sure you know what you're doing). Before giving permision you should take a look at the code by going to Tools -> Script Editor and verify that it doesn't do anything nefarious. I didn't write anything objectionable (other than the quality of the code), but you may be looking at a copy modified by someone with bad intentions.
  
### Parameters

On the left of the "Params" tab you'll find the basic parameters. I'll explain the non-obvious here:
- **Initial savings**: How much money you have sitting in your bank account
- **Emergency stash**: how much money do you want to have available at all times in case you lose your job or have an expensive unexpected event happen to you.
- **State pension weekly**: The state pension is paid weekly and depends on how many periods you contributed to it. Read about it here.
- **Pension contribution**: How much do you want to pay into a private occupational pension scheme. If you enter 100% here, it will contribute the maximum allowed (15% - 40% of your gross salary depending on age).
- **ETF allocation**: If you have any money left after contributing to private pension, paying for expenses and taxes, how much of that do you want to invest in ETFs.
- **Trust allocation**: Same as above but for investment trusts. So the sum of both can't exceed 100%. If they add up to anything less than 100%, you'll be saving that in cash.
- **Pension growth**: How much you expect the pension fund to grow yearly. Pension providers let you choose between different portfolios, so you have some control over this. Keep in mind they tend to have higher fees, so take that into account when calculating this number.
- **ETF growth**: ETFs have very low fees but gains are taxed at 41% on exit and every 8 years. They are still a valid instrument because they allow you to diversify effortlessly. In case you're wondering, the simulation tracks and computes the deemed disposal tax for each separate (yearly) purchase. Dividends are not considered as a separate event and are assumed to be reinvested.
- **Trust growth**: Investment trusts are actively managed funds, thus have higher fees and risk, but gains are taxed on exit at 33%. Dividends are not considered as a separate event and are assumed to be reinvested. You can read more about investment options here.
- **Priorities**: Once in retirement you will start to draw down on your investments. Here you decide where to take money from first (priority 1), then where to take it from after the first choice is depleted (priority 2), and so on.

### Events

These are the life events that define your scenario. Each event is a row in this table, where each column is described as:
  
1. **Event spec**: Specifies the event type and name. It has to follow the format <type>:<name> (for example "E:college").
   - Type must be one of SI (salary income), RI (rent income), UI (RSU income), E (expense), R (real estate), M (mortgage).
   - The name can be anything you like, it's just so you know what it is. It's only important when it comes to real estate and mortgages, as explained below.
   - There can be more than one event for a type, for example changing salaries, adding a partner's salary, buying more than one property, etc.
2. **Value**: An amount of money, for example your salary (SI) or your expenses (E). With every passing year this value will be adjusted at the rate specified in the fifth column, or at the rate of inflation if the rate is left empty.
3. **Starting age**: The age you'll be when this event starts (inclusive). For example, at what age you expect to start spending money on your kid's education.
4. **Ending age**: The age you'll be when this event ends (inclusive).
5. **Rate of growth**: The rate at which the value will grow every year. If this value is ommitted, the inflation rate will be used.
6. **Pension match**: Only used for salary events, this is the maximum your employer will match your pension contribution.

These are the supported event types:
  
- **Salary Income event (SI)**: The gross salary, at present value, that you expect to earn from the start age to the end age, adjusted according to the rate you specify (or inflation if you leave it blank), plus a maximum pension match if your employer offers that. If you have more than one salary in the same year, I assume you are married from then on, which will affect tax credits.
- **Rent Income event (RI)**: The gross income from a rental property or other non-PAYE income, at present value, that you expect to earn from the start age to the end age, adjusted according to the rate you specify (or inflation if you leave it blank).
- **RSU Income event (UI)**: The gross income from Restricted Stock Units, provided by some employers as part of the compensation package, at present value, that you expect to earn from the start age to the end age, adjusted according to the rate you specify (or inflation if you leave it blank).
- **Expense event (E)**: An expense item, at present value, that you expect to spend from the start age to the end age, adjusted according to the rate you specify (or inflation if you leave it blank). I recommend specifying yearly total expenses, before and after retirement, plus any big item expenses that have specific time frames like education, and leaving the rate field blank so as to use inflation.
- **Real Estate event (R)**: The ownership of a real estate property, from the start age (purchase) to the end age (sale). In this case the fields are a bit different:
  - The name has to match the corresponding mortgage event (if there is one) exactly.
  - The value is the down payment if you buy it with a mortgage, otherwise it's the full price of the property.
  - The starting age is the age you'll be when you purchase this property. If you already own it, you can enter 0 here.
  - The ending age is the age you'll be when you sell the property. If you don't intend to ever sell it, enter 101 or greater, as the simulation goes to 100 years old.
  - The rate of growth is the expected market appreciation of the property.
- **Mortgage event (M)**: This event has to have a corresponding real estate event (but a real estate event does not need a mortgage event)
  - The name has to match the corresponding real estate event exactly.								
  - The value is the yearly re-payment. You can get this number from mortgage.ie (multiply the monthly repayment by 12).
  - The starting age is the age you'll be when you take the mortgage, and should match the age specified in the corresponding real estate event.
  - The ending age is when you expect to finish the re-payment of the loan, and should be equal or less than the age at which the property is sold.
  - The rate of growth is the mortgage loan rate.
  - The starting age of a mortgage (and corresponding purchase) can be before the current age. In that case the simulation will start with the correct number of loan re-payments already made.
  - You can sell a property before the loan is fully paid, the value you'll get takes the remaining debt into account.

### Cashflow graph

This graph shows the sources of income, before taxes, stacked on top of each other. Overlayed you'll see two lines, one for net income and one for expenses. Real Estate events can generate spikes in this graph, as you get a large amount of income when you sell a property.

Your scenario fails when income falls below expenses. This can happen because you're spending more than you earn, because you're contributing too much to a private pension, or because you run out of funds during retirement.

You can see a larger, more detailed version of this graph in the Income tab.

### Assets graph

This graph shows the different assets: cash savings, real estate, pension and investments. Your scenario fails when the only asset left is real estate. You can add an event to sell a property, if you have one, to avoid that. If that is your only property, add an expense event for rent.

There's a larger version of this graph in the Assets tab.										

### Data tab

Here you will see the actual numbers as they are computed by the simulator, year by year, from your current age to the age of 100.

The columns are mostly self-explanatory. The cash column under income may raise some eyebrows: it shows withdrawals from cash savings to cover expenses when the net income is not enough.
											
### Known issues
- State pension is only computed for one person. The private pension contribution percentage is assumed to be the same for both individuals.
- Some ETFs and investment trusts pay dividends which are taxed at 52%. When building this simulator I assumed the use of investments that accumulate dividends.
- There's other types of investments that pay different taxes on dividends and gains, I only implemented EU-based ETFs and trusts.

### Change log
- 1.00: Initial release.
- 1.01: Added marginal relief tax for age 65 or older and fixed an issue with the way I kept track of single vs. married.
- 1.02: Fixed issue where the system hoarded excess cash instead of investing it when salary income continued past retirement age.
- 1.03: Fixed issue where the company pension match was being taxed as income.
- 1.04: Fixed issue where pension contribution was not being deducted from net income or shown in the data tab.
- 1.05: Fixed issue with the maximum tax benefit for the occupational pension (thanks Hannah!).
