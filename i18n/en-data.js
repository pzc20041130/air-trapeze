/* 空中飞人 · English localization overlay (non-news user-facing text)
   Loaded after data.js; overrides display strings only. SIM_NEWS is handled elsewhere. */
(function () {
  'use strict';

  window.FX_EN_DATA = {
    contracts: {
      free: {
        kicker: 'NO CONTRACT',
        title: 'Free Mode',
        background: 'No contract, no goal.\nOpen as many trades as you want, leave whenever you want.',
        goalText: 'No goal — play until you feel like stopping.',
        limitText: 'Unlimited trades',
        specialText: 'Safety Net / Standard and loan rules unchanged.'
      },
      rent: {
        kicker: 'CONTRACT 01',
        title: "This Month's Rent",
        background: 'Your landlord has posted "you there?" in the group chat for the third time.\nPayday is still 9 days away, and you are $500 short on rent.\nThen you see an ad:\n"Trade forex from home. Win back your rent in a day."',
        goalText: 'Make $500 net profit, then stop.',
        limitText: 'Up to 5 trades',
        specialText: 'No borrowing available on this contract.'
      },
      debt: {
        kicker: 'CONTRACT 02',
        title: 'Pay Off Fat Fish Credit',
        background: 'You already owe Fat Fish Credit $3,000.\nMiss today\'s payment and the interest doubles tomorrow.\nYou look at the last $10,000 in the account\nand decide: "One comeback, then I\'m out."',
        goalText: 'Repay the $3,000 loan and bring equity up to $7,500.',
        limitText: 'Up to 10 trades',
        specialText: 'Starting debt $3,000; no new borrowing available.'
      },
      layoff: {
        kicker: 'CONTRACT 03',
        title: 'Day 30 of Being Laid Off',
        background: 'HR said, "The company appreciates your contribution."\nYou ran the numbers: the severance covers two months of rent, barely.\nEvery message on the job apps is read and ignored.\nYou decide to make $1,500 first, as a bridge.\nYou tell yourself: once I find a job, I stop.',
        goalText: 'Make $1,500 net profit, then stop.',
        limitText: 'Up to 8 trades',
        specialText: 'Starting cash $6,000; no borrowing available.'
      }
    },

    environments: {
      calm: {
        title: 'Calm Week',
        kicker: 'LOW VOLATILITY',
        desc: 'Fewer headlines, slower price action, lower targets.\nGood for playing it steady and finishing the contract.',
        rewardText: 'Grade cap: A'
      },
      central: {
        title: 'Central Bank Week',
        kicker: 'HIGH VOLATILITY',
        desc: 'More major events, bigger swings, higher targets.\nFor people who dare to take a view and put money behind it.',
        rewardText: '+1 grade tier on contract completion'
      },
      rumor: {
        title: 'Rumor Week',
        kicker: 'RUMOR MILL',
        desc: 'More shitposts and rumors, prices jerking up and down.\nTargets stay the same, but telling real from fake is on you.',
        rewardText: 'First shop item half price'
      }
    },

    shopItems: {
      intel: {
        title: 'A Single Tip',
        kicker: 'INTEL',
        desc: 'Know the headline of the next major event in advance.\nIt tells you what might happen, not which way it moves.'
      },
      insurance: {
        title: 'Stop-Loss Insurance',
        kicker: 'INSURANCE',
        desc: 'Your next stop-loss refunds the whole loss, up to $50.\nOne use and it is gone.'
      },
      extension: {
        title: 'One Extension',
        kicker: 'EXTENSION',
        desc: 'One extra trade on this contract.\nOne more straw to grab at.'
      },
      hedge: {
        title: 'Hedge Card',
        kicker: 'CARD · HEDGE',
        desc: 'Use during an emergency: close half of your current position.\nOne card per use.'
      },
      margin: {
        title: 'Margin Top-Up Card',
        kicker: 'CARD · MARGIN',
        desc: 'Use during an emergency: add $100 of margin from cash.\nOne card per use.'
      }
    },

    cards: {
      'trend-follow': {
        name: 'Trend Follower',
        styleLabel: 'Trend',
        desc: 'Trend-aligned trades cost 5% less in fees per level.\n2 Trend cards: another 5% off.'
      },
      'trend-break': {
        name: 'Breakout Hunter',
        styleLabel: 'Trend',
        desc: 'Take-profits pay an extra 5% of profit per level.\n2 Trend cards: another 5% off fees.'
      },
      'trend-apex': {
        name: 'Trend Sovereign',
        styleLabel: 'Trend',
        desc: 'Trend trades cost 7% less in fees per level; take-profits pay +5% per level.\n2 Trend cards: another 5% off.'
      },
      'news-wire': {
        name: 'Wire Trader',
        styleLabel: 'News',
        desc: 'A correct news call grants +1 extra news point per level.\n2 News cards: +1 more.'
      },
      'news-macro': {
        name: 'Macro Analyst',
        styleLabel: 'News',
        desc: 'The first strategy refresh in each act costs half price.\n2 News cards: +1 more news point.'
      },
      'news-oracle': {
        name: 'News Oracle',
        styleLabel: 'News',
        desc: '+1 news point per level; the first refresh in each act is half price.\n2 News cards: +1 more.'
      },
      'contrarian-revert': {
        name: 'Mean Reversion',
        styleLabel: 'Contrarian',
        desc: 'Unlocks "Flip" on emergency events.\n2 Contrarian cards: keep more margin when you flip.'
      },
      'contrarian-fade': {
        name: 'Contrarian Hunter',
        styleLabel: 'Contrarian',
        desc: 'Keep more margin when you flip, scaling with level.\n2 Contrarian cards: keep another 10%.'
      },
      'contrarian-ace': {
        name: 'Contrarian Ace',
        styleLabel: 'Contrarian',
        desc: 'Flip on emergency events and keep more margin.\nThe higher the level, the more you keep.'
      },
      'defense-risk': {
        name: 'Risk Officer',
        styleLabel: 'Defense',
        desc: 'Stop-losses refund 12% of the loss per level, up to $30.\n2 Defense cards: another 10% refunded.'
      },
      'defense-fortress': {
        name: 'Iron Wall',
        styleLabel: 'Defense',
        desc: 'Unlocks "Add Margin" on emergency events.\n2 Defense cards: stop-losses refund another 10%.'
      },
      'defense-bunker': {
        name: 'Defense Bunker',
        styleLabel: 'Defense',
        desc: 'Stop-losses refund 15% per level; add margin during emergencies.\n2 Defense cards: another 10% refunded.'
      }
    },

    achievements: {
      'air-trapeze': {
        name: 'Air Trapeze (Terminal Stage)',
        desc: 'Account equity exceeds starting capital by $100,000.',
        hint: 'Push equity $100,000 above the $10,000 start'
      },
      'buy-top': {
        name: 'Perfect Bag Holder',
        desc: 'Open a long near the high of the last 40 candles.',
        hint: 'Go long within 0.2% of the recent high'
      },
      'finger-support': {
        name: 'Finger Support Line',
        desc: 'The position you saved with a top-up loan blew up anyway.',
        hint: 'Get liquidated after topping up with borrowed money'
      },
      'never-sell': {
        name: 'It\'s Not a Loss If You Don\'t Sell',
        desc: 'Hold one position in floating loss without closing (3 minutes in simulation / 15 trading days in replay).',
        hint: 'Clutch a losing position for a long stretch'
      },
      'just-kill-me': {
        name: 'Just Kill Me Then',
        desc: 'Pick "Not now" on a risk warning, then blow up.',
        hint: 'Refuse to top up until you get liquidated'
      },
      'black-swan': {
        name: 'Saw a Black Swan Up Close',
        desc: 'Advance the Franc De-Peg battle to 2015-01-15.',
        hint: 'Advance the Franc De-Peg battle to its event day'
      },
      'first-blowup': {
        name: 'First Diagnosis: Blown Up',
        desc: 'First time you are forcibly liquidated. Welcome to your file.',
        hint: 'Get blown up once'
      },
      'sorry-family': {
        name: 'The Ones I Let Down Most Are My Family',
        desc: 'Loan principal reaches $100,000.',
        hint: 'Borrow $100,000 in one go'
      },
      'sure-win': {
        name: 'I Have a Surefire System',
        desc: 'Account equity exceeds starting capital by $1,000,000.',
        hint: 'Reach one million in gains'
      },
      'honest-work': {
        name: 'Honest Money. Boring, Right?',
        desc: 'Close your first profitable trade.',
        hint: 'Close one trade in profit'
      },
      'freefall': {
        name: 'Free Fall',
        desc: 'Account equity falls $100,000 below starting capital.',
        hint: 'Drop equity $100,000 below $10,000'
      },
      'retire': {
        name: 'Washing My Hands of It',
        desc: 'Finish a daily challenge and settle the score.',
        hint: 'Start and finish one challenge'
      },
      'last-word': {
        name: 'One Last Time',
        desc: 'Press "one more hand, quit when I break even" for the 10th time.',
        hint: 'Press "One Last Time" ten times'
      },
      'grade-s': {
        name: 'Grade-S Incident',
        desc: 'Earn an S grade on a contract in Hard Mode.',
        hint: 'Finish a contract with few trades and low drawdown'
      },
      'style-collector': {
        name: 'Style Collector',
        desc: 'Collect 5 different playstyles across your case files.',
        hint: 'Finish hard contracts with a few different approaches'
      }
    },

    tutorial: [
      {
        title: 'Two Rules First: How You Make Money',
        text: 'Long: you buy first and only profit if price rises — your close must be above your entry. Short: you sell first and only profit if price falls — your close must be below your entry.',
        example: 'Example: long at 1.1000, close at 1.1010 → profit; close at 1.0990 → loss. Short is the mirror image.'
      },
      {
        title: 'Pick a Direction: Long or Short',
        text: 'Long bets on up, short bets on down. Pick a pair, then hit "Long / Buy" or "Short / Sell". At close, a long wins if price is above entry; a short wins if it is below.',
        example: 'Example: EUR/USD rises from 1.0800 to 1.0900 — the long side is the one with the wind behind it.'
      },
      {
        title: 'Margin and Leverage',
        text: 'Margin is the money you put up front; leverage multiplies your notional position — and with it your P&L and fees. The higher the leverage, the less movement the same margin can absorb.',
        example: 'Example: $500 margin × 20x = $10,000 notional, with fees around $1.50.'
      },
      {
        title: 'Risk: 60% Warning, 80% Liquidation',
        text: 'A floating loss at 60% of margin triggers a warning; at 80% you get forcibly closed. On a gap, losses can exceed your margin. Beginners should set a stop-loss or trim with a partial close.',
        example: 'Example: at 20x, a move of about 4% against you hits the liquidation line.'
      },
      {
        title: 'Walking Away: The Only Way to Win',
        text: 'Leave while you are up, or at least stop borrowing. There is no safety net on that screen — only the exit key you press yourself.',
        example: 'Example: hitting "Cash Out" near the peak looks better than screenshotting the blow-up.'
      }
    ],

    endings: {
      airborne: {
        title: 'Air Trapeze',
        text: 'You never landed.\nYou just keep hanging in the air, carrying {debt} of debt.\nFat Fish Credit says it will wait for you.'
      },
      fall: {
        title: 'Free Fall',
        text: 'You hit the ground from a great height.\nPoor form, perfect entertainment value.'
      },
      'rent-paid': {
        title: 'Rent Paid',
        text: 'The landlord takes the rent and says not to be late next month.\nYou close the trading app, and the room is quiet for the first time.'
      },
      'rent-drag': {
        title: 'Next Month, Then',
        text: 'Rent is paid.\nYour landlord looks at you like a repeat offender.'
      },
      'rent-card': {
        title: 'The Bill Remembers for You',
        text: 'Rent is paid.\nThe credit card bill rolls into next month, and interest keeps the record for you.'
      },
      'rent-run': {
        title: 'Change Cities',
        text: 'You didn\'t pay the rent, and you can\'t face going back.\nThe agent changed the locks; you keep hunting for the next rental, phone in hand.'
      },
      'debt-clear': {
        title: 'Back on Dry Land',
        text: 'Your Fat Fish Credit balance hits zero.\nYou drag the app into a folder called "Later."'
      },
      'debt-family': {
        title: 'Family Catches You',
        text: 'The debt is gone.\nMom didn\'t ask where the money came from. She only asked whether you\'ve been sleeping.'
      },
      'debt-console': {
        title: 'Traveling Light',
        text: 'The console is gone, and so is the debt.\nThere is an empty space in the room, but at least nobody calls anymore.'
      },
      'debt-run': {
        title: 'On the Run',
        text: 'You block Fat Fish Credit.\nIt calls from a new number.'
      },
      'layoff-job': {
        title: 'Employed Again',
        text: 'You passed the interview.\nYou deleted the trading app for three days, reinstalled it on the fourth — but at least you show up for work.'
      },
      'layoff-flex': {
        title: 'Flexible Employment',
        text: 'The tip from the group chat did not make you rich, but it gave you a new job title: flexibly employed.'
      },
      'layoff-fought': {
        title: 'Fought for It',
        text: 'You fought for what you deserved and lost what you should not have kept.\nThe day the severance lands, you split it in two: half for living, half to keep gambling.'
      },
      'layoff-gig': {
        title: 'Taking It for Now',
        text: 'You weren\'t ready for the interview and you didn\'t make enough money.\nTake the job for now — at least the insurance hasn\'t lapsed.'
      },
      'layoff-run': {
        title: 'Change Cities',
        text: 'New city, new number,\nsame pitiful balance in the account.'
      }
    },

    glossary: {
      '账户总权益': 'Account equity',
      '总权益': 'Total equity',
      '可用余额': 'Available balance',
      '浮动盈亏': 'Floating P&L',
      '浮盈': 'Floating profit',
      '浮亏': 'Floating loss',
      '已用保证金': 'Used margin',
      '待还贷款': 'Loan outstanding',
      '保证金': 'Margin',
      '杠杆': 'Leverage',
      '名义仓位': 'Notional position',
      '仓位': 'Position',
      '做多': 'Long',
      '做空': 'Short',
      '开仓价': 'Entry price',
      '开仓价格': 'Entry price',
      '当前价': 'Current price',
      '当前价格': 'Current price',
      '平仓': 'Close position',
      '部分平仓': 'Partial close',
      '止损': 'Stop-loss',
      '止盈': 'Take-profit',
      '进阶交易': 'Advanced trading',
      '爆仓价': 'Liquidation price',
      '爆仓': 'Blow-up',
      '强制平仓': 'Forced liquidation',
      '风险度': 'Risk level',
      '风险比例': 'Risk ratio',
      '手续费': 'Trading fee',
      '追加保证金': 'Add margin',
      '借款补仓': 'Borrow to top up',
      '穿仓': 'Negative balance blowout',
      '峰值': 'Peak equity',
      '回撤': 'Drawdown',
      '最后一次': 'One last time',
      '日利率': 'Daily interest rate',
      '跳空': 'Gap',
      '安全网': 'Safety Net',
      '空中飞人线': 'Air Trapeze line',
      '诊断': 'Diagnosis'
    },

    battles: [
      {
        title: 'The Defense of the Euro',
        description: 'EUR/USD sinks to a record low, the G7 intervenes jointly, and the ECB hikes again and again.',
        tagline: 'The euro had barely learned to walk before the market ground it into the floor.',
        news: [
          {
            tag: 'Central Bank Rhetoric',
            title: 'Officials Say a Too-Weak Euro Is Unwelcome',
            body: 'ECB officials make verbal-intervention noises, but the euro bounce lasts barely any time at all.'
          },
          {
            tag: 'Joint Intervention',
            title: 'G7 Central Banks Buy Euros',
            body: 'Major central banks intervene together in the FX market, the euro jumps, and shorts are forced to cover.'
          },
          {
            tag: 'Aftermath',
            title: 'The Intervention Starts to Fade',
            body: 'Attention returns to the US-Europe growth gap, and the euro sags again after its brief bounce.'
          }
        ]
      },
      {
        title: '9/11: The Flight to Safety',
        description: 'After the attacks, global markets run for cover: the franc and the yen strengthen while the dollar buckles.',
        tagline: 'That day every screen was red — except the franc.',
        news: [
          {
            tag: 'Before the Storm',
            title: 'Calm Markets, Volatility Near Lows',
            body: 'FX chops in a narrow range while traders watch the ECB and BOJ policy meetings.'
          },
          {
            tag: 'Breaking Event',
            title: 'New York and Washington Attacked',
            body: 'US financial markets shut down; safe-haven money floods into the franc, the yen and gold, and dollar liquidity evaporates.'
          },
          {
            tag: 'Reopening',
            title: 'US Stocks Reopen and the Dollar Swings Wildly',
            body: 'Markets whip back and forth between demand for safety and demand for dollars, and volatility stays elevated.'
          }
        ]
      },
      {
        title: 'The Lehman Moment',
        description: 'Lehman Brothers collapses, global credit freezes, and the pound and risk currencies crater.',
        tagline: 'Systemic risk means: the system is fine. You are not.',
        news: [
          {
            tag: 'Bailout',
            title: 'US Government Seizes Fannie and Freddie',
            body: 'Both mortgage giants are taken over; markets exhale briefly, but interbank markets keep tightening.'
          },
          {
            tag: 'Bankruptcy',
            title: 'Lehman Brothers Files for Bankruptcy',
            body: 'Global risk assets are dumped, high-yielders like the pound fall fast, and the safe havens firm up.'
          },
          {
            tag: 'Coordinated Cut',
            title: 'Major Central Banks Cut Rates in Unison',
            body: 'Stocks bounce briefly, but the credit squeeze and recession fears quickly take over again.'
          }
        ]
      },
      {
        title: 'The Flash Crash',
        description: 'The Greek debt crisis escalates, the Dow crashes intraday, and the euro and risk assets swing violently.',
        tagline: 'A trillion dollars gone in nine minutes; your stop-loss took ten seconds.',
        news: [
          {
            tag: 'Bailout',
            title: 'Eurozone and IMF Agree to Rescue Greece',
            body: 'A €110 billion package is agreed, but markets fear the crisis spreading to Portugal and Spain.'
          },
          {
            tag: 'Intraday Crash',
            title: 'The Dow Drops Nearly 1,000 Points',
            body: 'Liquidity vanishes in an instant, quotes jump to extremes, and FX spreads widen at the same time.'
          },
          {
            tag: 'Stabilization Fund',
            title: 'EU Launches a €750 Billion Stabilization Mechanism',
            body: 'The euro bounces short-term, but the fundamental worry about sovereign debt never leaves.'
          }
        ]
      },
      {
        title: 'The Night of the Downgrade',
        description: 'The US loses its top credit rating, the euro debt crisis spreads, and the eurozone banking system strains.',
        tagline: 'America gets downgraded and the euro breaks first. Logic is optional; volatility is not.',
        news: [
          {
            tag: 'Bailout',
            title: 'Eurozone Agrees to a Second Greek Bailout',
            body: 'Leaders buy time with lower rates and longer maturities, and markets are not entirely convinced.'
          },
          {
            tag: 'Downgrade',
            title: 'S&P Cuts the US Sovereign Rating',
            body: 'The US loses its AAA rating, risk assets fall across the board, and EUR/USD whipsaws between safety bids and Europe\'s own problems.'
          },
          {
            tag: 'Franc Ceiling',
            title: 'SNB Sets a Floor Under EUR/CHF',
            body: 'The franc weakens sharply, FX reprices its safe-haven trades, and volatility spills into the euro crosses.'
          }
        ]
      },
      {
        title: 'The Draghi Moment',
        description: 'Draghi vows to defend the euro "whatever it takes", and euro shorts get a violent reversal.',
        tagline: '"Whatever it takes" — including your position.',
        news: [
          {
            tag: 'Bank Bailout',
            title: 'Eurozone Agrees to Rescue Spanish Banks',
            body: 'A package of up to €100 billion is announced; markets calm briefly, but the euro stays fragile.'
          },
          {
            tag: 'Key Speech',
            title: 'Draghi: We Will Do Whatever It Takes',
            body: 'One sentence resets expectations, and euro shorts start covering fast.'
          },
          {
            tag: 'OMT',
            title: 'ECB Unveils Outright Monetary Transactions',
            body: 'The ECB promises to buy sovereign bonds under strict conditions, giving the euro a temporary floor.'
          }
        ]
      },
      {
        title: 'The Night the Franc Broke Free',
        description: 'The SNB abruptly abandons the 1.20 floor on EUR/CHF, and the rate reprices violently within minutes.',
        tagline: 'A policy floor that held for three years vanished in a single morning.',
        news: [
          {
            tag: 'Central Bank Policy',
            title: 'SNB Pushes Rates Below Zero',
            body: 'The SNB imposes negative rates on excess sight deposits and once again insists it will defend 1.20 per euro.'
          },
          {
            tag: 'Market Watch',
            title: 'Everyone Is Watching 1.20',
            body: 'Traders treat 1.20 as an unbreakable policy floor and pile options and stop-losses around it.'
          },
          {
            tag: 'Shock Decision',
            title: 'The Floor Is Gone',
            body: 'The SNB scraps the minimum rate and cuts further. Quotes lose liquidity instantly and spreads blow out.'
          }
        ]
      },
      {
        title: 'Referendum Night',
        description: 'The Brexit result lands, and the pound drops hard during the Asian session.',
        tagline: 'Polls, odds and results all stopped working on the same night.',
        news: [
          {
            tag: 'Risk Warning',
            title: 'BOE Flags Referendum Risk',
            body: 'The BOE lists the vote as a near-term financial stability risk, and markets start pricing big sterling swings.'
          },
          {
            tag: 'Voting Day',
            title: 'Polls Close, Counting Begins',
            body: 'Results trickle in, but bookmaker odds and polls still point to Remain, and sentiment stays upbeat.'
          },
          {
            tag: 'Result Announced',
            title: 'Leave Wins',
            body: 'The count defies expectations and the pound collapses. The BOE says it stands ready to provide liquidity.'
          }
        ]
      },
      {
        title: 'Pandemic Dollar Squeeze',
        description: 'The pandemic goes global, dollar liquidity tightens, and GBP/USD slides to near a 35-year low.',
        tagline: 'The virus did not quarantine you. Your leverage did.',
        news: [
          {
            tag: 'Outbreak Spreads',
            title: 'Outbreak Erupts in Northern Italy',
            body: 'Europe turns risk-off, risk currencies sag, and the dollar and the yen find bids.'
          },
          {
            tag: 'Oil Collapse',
            title: 'An Oil Price War Sparks a Global Selloff',
            body: 'Risk assets fall together, liquidity drains fast, and FX spreads widen sharply.'
          },
          {
            tag: 'Dollar Crunch',
            title: 'Major Central Banks Expand Dollar Swap Lines',
            body: 'Dollar funding stress peaks, and GBP/USD drops to near multi-decade lows.'
          },
          {
            tag: 'Unlimited QE',
            title: 'The Fed Announces Unlimited Quantitative Easing',
            body: 'Liquidity expectations flip, risk assets rip higher, and shorts are caught completely off guard.'
          }
        ]
      },
      {
        title: 'Closing In on Parity',
        description: 'An energy crisis plus a strong dollar push EUR/USD toward 1:1 for the first time in twenty years.',
        tagline: 'A twenty-year psychological line at parity, delivered by an energy bill.',
        news: [
          {
            tag: 'Policy Signal',
            title: 'ECB Signals Rate Hikes',
            body: 'The ECB says it will end net asset purchases in July and hike; markets reprice the eurozone rate path.'
          },
          {
            tag: 'Key Level',
            title: 'The Euro Slides Toward Parity',
            body: 'Energy supply fears, slowing growth and a strong dollar combine, and EUR/USD closes in on 1.00.'
          },
          {
            tag: 'Rate Decision',
            title: 'ECB Hikes 50 Basis Points',
            body: 'The hike beats prior guidance and comes with a transmission protection tool, giving the euro a short-term lift.'
          }
        ]
      },
      {
        title: 'The Yen Intervention',
        description: 'The BOJ holds firm on easing, USD/JPY races higher, and the Ministry of Finance steps in to buy yen.',
        tagline: 'When rate differentials meet intervention, even being right can throw you off the ride.',
        news: [
          {
            tag: 'Verbal Intervention',
            title: 'Officials Warn Against One-Way Moves',
            body: 'USD/JPY climbs fast, and MOF officials voice strong concern about one-sided, sharp currency moves.'
          },
          {
            tag: 'Market Intervention',
            title: 'Japan Buys Yen',
            body: 'Right after the BOJ keeps policy loose, Japanese authorities step into the market to buy yen.'
          },
          {
            tag: 'Wild Swings',
            title: 'A Sharp Drop From the Highs',
            body: 'USD/JPY suddenly rolls over near its highs, and the market later confirms another round of intervention.'
          }
        ]
      },
      {
        title: 'The Gilt Storm',
        description: 'The UK mini-budget sends gilts and the pound into freefall, forcing an emergency BOE intervention.',
        tagline: 'The pension funds nearly blew up. You got there first.',
        news: [
          {
            tag: 'Mini-Budget',
            title: 'UK Unveils a Large Tax-Cut Plan',
            body: 'Markets doubt fiscal sustainability, gilt yields spike, and the pound comes under pressure.'
          },
          {
            tag: 'Record Low',
            title: 'GBP/USD Nears a Record Low',
            body: 'The rate swings violently, and margin pressure hits leveraged accounts all at once.'
          },
          {
            tag: 'Central Bank Rescue',
            title: 'BOE Buys Long Gilts in an Emergency',
            body: 'The BOE moves to steady liquidity in the pension system, and sterling and gilts stabilize briefly.'
          }
        ]
      },
      {
        title: 'Silicon Valley Bank: 48 Hours',
        description: 'Silicon Valley Bank fails within 48 hours, and safe-haven money rushes into the franc and gold.',
        tagline: 'Deposit insurance protects deposits. Not you.',
        news: [
          {
            tag: 'Bank Trouble',
            title: 'Silvergate Announces Voluntary Liquidation',
            body: 'Markets start re-examining US regional bank balance sheets and deposit stability.'
          },
          {
            tag: 'Collapse',
            title: 'Regulators Seize Silicon Valley Bank',
            body: 'The bank run sets a record, and safe-haven money flows into the franc, the yen and gold.'
          },
          {
            tag: 'Credit Suisse',
            title: 'UBS Agrees to Buy Credit Suisse',
            body: 'Regulators push the merger through to avoid systemic risk, but sentiment stays fragile.'
          }
        ]
      },
      {
        title: 'The Yen Carry Unwind',
        description: 'The BOJ hikes, US jobs data weakens, and the yen carry trade unwinds all at once.',
        tagline: 'Borrow yen, buy dollars — then the yen rallies.',
        news: [
          {
            tag: 'BOJ',
            title: 'BOJ Hikes and Trims Bond Buying',
            body: 'The yen starts to firm, and the rate-differential logic behind the carry trade cracks.'
          },
          {
            tag: 'Jobs Data',
            title: 'US Jobs Data Misses Expectations',
            body: 'Markets bet on Fed cuts, the dollar softens, and yen shorts begin to retreat.'
          },
          {
            tag: 'Mass Unwind',
            title: 'The Yen Carry Trade Deleverages Violently',
            body: 'USD/JPY plunges, risk assets sag in sympathy, and liquidity thins out badly in the Asian session.'
          }
        ]
      }
    ]
  };
})();
