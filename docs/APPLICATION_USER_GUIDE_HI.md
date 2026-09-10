# School Fee Management Application
## Complete User Guide aur Fee Calculation Manual

**Document version:** 3.0 — Final Project Guide  
**Updated:** 16 July 2026

Ye final handover document application setup, daily usage, fee calculation, discounts, quarterly payments, fee quote vs save payment, Super Admin refund/correction, receipts aur reports ka complete process explain karta hai.

---

## 1. Application ka purpose

Is application ka use school ke:

- Students manage karne
- Class aur section banane
- Academic sessions manage karne
- Class-wise fee structure set karne
- Transport routes aur transport fee manage karne
- Quarterly fee collect karne
- Previous-session dues collect karne
- Payment receipt generate aur print karne
- Pending fee aur collection dekhne
- Monthly aur quarterly Excel reports download karne

ke liye kiya jata hai.

---

## 2. User roles

### Super Admin

Super Admin:

- Admin users create aur manage kar sakta hai
- School settings update kar sakta hai
- Sessions, classes aur sections manage kar sakta hai
- Fee structure aur fee policy set kar sakta hai
- Transport routes manage kar sakta hai
- Students manage kar sakta hai
- Sabhi admins ki collections aur reports dekh sakta hai

### Admin

Admin:

- Students dekh aur manage kar sakta hai
- Student fee collect kar sakta hai
- Receipt generate kar sakta hai
- Apni collections aur reports dekh sakta hai

User ko apna email aur password Super Admin se lena hoga. Password kisi ke saath share na karein.

---

## 3. First-time application setup

Application ko pehli baar use karte samay Super Admin ko neeche diya order follow karna chahiye.

### Step 1: School Settings

**Settings** page mein:

- School name
- Application name
- School logo
- Address
- Phone number
- Email

save karein. Ye details application aur receipts par use ho sakti hain.

### Step 2: Academic Session

**Sessions** page mein school session banayein, jaise:

- 2025-26
- 2026-27

Jo session currently chal raha hai usko current session set karein.

> Fee structure aur payment hamesha selected academic session ke saath save hote hain.

### Step 3: Classes

**Classes** page mein classes add karein, jaise:

- Play Group
- Nursery/KG0/PP3
- LKG/KG1/PP2
- UKG/KG2/PP1
- I, II, III ... XII

Application Classes page aur sabhi dropdowns mein classes ko school sequence mein automatically dikhati hai:

```text
Play Group → Nursery → LKG → UKG → I → II → III → ... → XII
```
### Step 4: Sections

**Sections** page mein har class ke sections banayein, jaise:

- Class 1 – A
- Class 1 – B
- Class 2 – A

### Step 5: Transport Routes

**Transport Routes** page mein:

- Village/route name
- Route ki monthly transport fee

enter karein.

Example:

```text
Route: Rampur
Monthly Transport Fee: ₹600
```

### Step 6: Fee Structure

**Fee Structure** page mein har class aur academic session ke liye fee set karein:

- Monthly Tuition Fee
- Admission Fee
- Annual/Development Fee
- ID Card/Diary Fee
- Exam Fee
- Form/Insurance/Other Fee
- Class Default Discount

Har class ke liye selected session mein fee structure hona zaroori hai. Fee structure ke bina student ki fee calculate nahi hogi.

---

## 4. Student management

### Single student add karna

**Students → New Student** page kholein aur:

- Student name
- Registration/admission details
- Father/guardian details
- Mobile number
- Class
- Section
- Academic session
- Student-specific discount
- Transport required hai ya nahi
- Transport route

fill karke student save karein.

### Excel se students import karna

Agar bahut students add karne hain to **Students → Import Excel** use karein.

Import se pehle:

- Class aur section application mein pehle se bane hone chahiye
- Academic session bana hona chahiye
- Excel columns aur data format sahi hona chahiye
- Duplicate registration/admission records check karne chahiye

---

## 5. Fee calculation ka complete system

### 5.1 Yearly tuition calculation

```text
Yearly Tuition = Monthly Tuition Fee × 12
Quarterly Tuition = Monthly Tuition Fee × 3
```

Example:

```text
Monthly Tuition Fee = ₹1,000
Yearly Tuition = ₹1,000 × 12 = ₹12,000
Quarterly Tuition = ₹1,000 × 3 = ₹3,000
```

### 5.2 Academic quarters

| Quarter | Months |
|---|---|
| Q1 | April–June |
| Q2 | July–September |
| Q3 | October–December |
| Q4 | January–March |

### 5.3 Default quarterly fee distribution

#### Quarter 1

```text
3 months tuition
+ Admission Fee (sirf new student ke liye)
+ Annual/Development Fee
+ ID Card/Diary Fee
+ Form/Insurance/Other Fee
+ 2 months transport
```

#### Quarter 2

```text
3 months tuition
+ 50% Exam Fee
+ 3 months transport
```

#### Quarter 3

```text
3 months tuition
+ Remaining 50% Exam Fee
+ 3 months transport
```

#### Quarter 4

```text
3 months tuition
+ 3 months transport
```

Super Admin fee policy settings se annual fee components ka quarter allocation badal sakta hai. Kisi component ki allocation sab quarters ko mila kar 100% honi chahiye.

### 5.4 Transport fee calculation

Transport fee 11 months ke liye calculate hoti hai:

```text
Yearly Transport Fee = Route Monthly Fee × 11
```

Quarter distribution:

- Q1: 2 months
- Q2: 3 months
- Q3: 3 months
- Q4: 3 months

Example:

```text
Monthly Transport Fee = ₹600
Yearly Transport Fee = ₹600 × 11 = ₹6,600

Q1 Transport = ₹1,200
Q2 Transport = ₹1,800
Q3 Transport = ₹1,800
Q4 Transport = ₹1,800
```

Student ko transport fee tabhi lagegi jab:

- “Uses school transport” Yes ho
- Valid transport route selected ho

### 5.5 Admission fee

New student ki fee collect karte samay:

**“New student — include admission pack”** checkbox select karein.

Admission fee Q1 mein add hoti hai.

```text
Old Student Gross Fee = Regular yearly charges
New Student Gross Fee = Regular yearly charges + Admission Fee
```

Ek baar admission fee ke saath payment save ho gayi to application future calculations mein admission fee automatically retain karegi.

### 5.6 Gross fee formula

```text
Gross Fee =
Yearly Tuition
+ Annual/Development Fee
+ ID Card/Diary Fee
+ Exam Fee
+ Form/Insurance/Other Fee
+ Yearly Transport Fee
+ Admission Fee (new student only)
```

### 5.7 Discount calculation

Application mein do tarah ke discounts ho sakte hain:

1. **Class Default Discount:** Fee Structure mein set hota hai
2. **Student Extra Discount:** Student ke liye alag se set hota hai

```text
Total Discount = Class Default Discount + Student Extra Discount
Net Yearly Fee = Gross Fee − Total Discount
```

Rules:

- Discount negative nahi ho sakta
- Total discount gross fee se zyada apply nahi hota
- Discount pehle quarterly fee mein proportionally distribute hota hai
- Uske baad payments quarters ke against adjust hote hain
- Student Discount enter karte hi Q1–Q4 due aur pending ka live preview update hota hai
- Quarter select karne par discounted pending amount auto-fill hota hai
- Collection page par badla hua student discount payment submit hone ke saath save hota hai

Quarter-wise approximate formula:

```text
Quarter Discount =
Total Discount × Quarter Gross Due ÷ Yearly Gross Fee
```

Discount kisi ek quarter se nahi, sabhi quarters se unke gross due ke proportion mein kam hota hai. Q1 mein annual/admission charges zyada hone par Q1 ko discount ka comparatively bada hissa mil sakta hai.

### 5.8 Complete calculation example

Maan lijiye fee details:

```text
Monthly Tuition                 ₹1,000
Annual/Development Fee          ₹2,000
ID Card/Diary Fee                 ₹500
Exam Fee                        ₹1,000
Form/Insurance/Other Fee          ₹300
Monthly Transport Fee             ₹600
Admission Fee                   ₹3,000
```

Old student:

```text
Yearly Tuition     ₹1,000 × 12 = ₹12,000
Annual Fee                         ₹2,000
ID Card/Diary                        ₹500
Exam Fee                           ₹1,000
Other Fee                            ₹300
Transport            ₹600 × 11 = ₹6,600
------------------------------------------------
Gross Fee                          ₹22,400
```

Agar:

```text
Class Discount   = ₹1,000
Student Discount = ₹500
Total Discount   = ₹1,500
```

to:

```text
Net Fee = ₹22,400 − ₹1,500 = ₹20,900
```

New student ke liye:

```text
Gross Fee = ₹22,400 + ₹3,000 Admission Fee
          = ₹25,400

Net Fee = ₹25,400 − ₹1,500
        = ₹23,900
```

### 5.9 Payment aur balance formula

```text
Previous Due = Net Yearly Fee − Already Paid Amount
New Balance = Previous Due − Current Payment
```

Example:

```text
Net Yearly Fee = ₹20,900
Already Paid = ₹5,000
Previous Due = ₹15,900
Current Payment = ₹3,000
New Balance = ₹12,900
```

### 5.10 Quarter status

Har quarter ka status:

- **Pending:** Quarter ke against payment nahi hui
- **Partial:** Quarter ka kuch amount paid hai
- **Paid:** Quarter ka complete due paid hai

Fully paid quarter:

- Green/paid status dikhata hai
- Dobara clickable nahi hota
- Backend duplicate payment ko bhi reject karta hai

Quarter ke due amount se zyada payment selected quarter mein accept nahi honi chahiye.

---

## 6. Student fee collect karna

### Recommended process

1. **Fee Collection** page kholein
2. Student ko name, registration number ya details se search karein
3. Student ke saamne **Collect Fee** open karein
4. Sahi academic session select karein
5. Transport details verify karein
6. New student ho to admission checkbox select karein
7. Student discount check karein; change karne par updated quarterly due verify karein
8. Jis quarter ki fee leni hai us quarter tile par click karein
9. Application pending amount auto-fill karegi
10. Payment mode select karein
11. Zaroorat ho to remarks enter karein
12. Customer ko sirf fee dikhani ho to **Print Fee Quote** use karein (save nahi hota)
13. Fee collect karni ho to **Save Payment** use karein
14. Saved payment ke baad receipt page open hogi — wahan se Print Slip karein

### Print Fee Quote vs Save Payment

| Action | Kya hota hai |
|---|---|
| **Print Fee Quote** | Poori fee breakdown + quarterly schedule print hoti hai. Receipt number nahi banta. Dashboard/reports mein kuch save nahi hota. |
| **Save Payment** | Payment database mein save hoti hai. Balance, dashboard, reports update hote hain. Official receipt banati hai. |

> Quote slip par clearly likha hota hai: **Fee Quote — Not a Receipt**.

### Back button

Har authenticated page par chhota **Back** (←) button milta hai. Ye sirf ek step peeche browser history mein le jata hai — aage-peeche jump nahi karta. Dashboard par Back hide rehta hai.

### Important collection rules

- Payment se pehle student aur session verify karein
- Quarter tile select karke payment karna recommended hai
- Paid quarter mein dobara payment na karein
- Payment amount quarter pending se zyada na rakhein
- Receipt generate hone ke baad receipt number verify karein
- Galat student ke record mein payment save na karein
- Sirf Save Payment se hi collection record hoti hai — Print Quote se nahi

### Manual/custom amount

Agar payment amount manually change kiya jata hai to selected quarter clear ho sakta hai. Application payment ko oldest pending quarter se map karti hai.

Accurate quarter reporting ke liye:

- Pehle quarter tile select karein
- Usi quarter ke pending amount tak payment collect karein
- Ek se zyada quarters ki fee ho to quarters ko separately collect karna safest hai

---

## 6A. Super Admin — Refund aur Correction

Sirf **Super Admin** galat payment ko refund ya correct kar sakta hai. Normal Admin ko ye buttons nahi dikhte.

### Refund

1. Student collect page → Previous Fee Slips
2. Active payment par **Refund** click karein
3. Audit reason enter karein (zaroori)
4. Original receipt history mein rehti hai (Refunded badge / watermark)
5. Student pending balance wapas open ho jata hai
6. Dashboard aur reports se woh amount hat jata hai

### Correct (wrong payment fix)

1. Same slips list mein **Correct** click karein
2. Reason, corrected amount, payment mode, quarter enter karein
3. System pehle original payment ko corrected mark karta hai
4. Phir nayi validated payment create karta hai (naya receipt number)
5. Original amount balances se nikal jata hai; naya amount count hota hai

Rules:

- Payment delete nahi hoti — audit trail hamesha rehta hai
- Ek baar refunded/corrected payment dobara refund/correct nahi hoti
- Standalone previous-dues slips ke liye correction nahi — pehle refund, phir dubara enter karein

---

## 7. Previous-session dues

Student collection page par **Previous Session Dues** section available hai.

### Existing previous session

Agar session application mein available hai:

- Session name select/type karein
- Application us session ki total fee, paid fee aur pending fee dikhayegi
- Pending amount se zyada payment accept nahi hoga

### Manual previous due

Agar purana session system mein nahi hai:

- Session name manually enter karein
- Due amount enter karein
- Payment mode select karein
- Receipt generate karein

Standalone previous-due receipt current session ke regular fee balance ko affect nahi karti.

---

## 8. Receipt

Successful payment ke baad receipt generate hoti hai.

Receipt mein verify karein:

- Receipt number
- Student name
- Registration/admission number
- Class aur section
- Academic session
- Payment amount
- Payment mode
- Payment date
- Remaining balance
- Collector details

Receipt ko browser print option se print ya PDF ke roop mein save kiya ja sakta hai.

---

## 9. Dashboard

Dashboard par selected session ke liye:

- Total active students
- Total fee collected
- Today’s collection
- Total pending fee
- Recent payments
- Highest pending students
- Q1–Q4 due, collected aur pending
- Paid aur pending students count

dikhayi deta hai.

Normal Admin ko role permissions ke according apni collection information dikh sakti hai. Super Admin ko complete school-level data dikh sakta hai.

---

## 10. Reports aur Excel download

**Reports** page par filters:

- Academic Session
- Quarter
- Class
- Collected By/Admin (Super Admin)

available hain.

### Quarterly Excel

Quarterly Excel mein:

- Student details
- Q1–Q4 total due
- Q1–Q4 paid amount
- Q1–Q4 pending amount
- Quarter status
- Overall pending
- Collection transactions

milte hain.

### Monthly Excel

Monthly Excel actual payment date ke according:

- Month
- Collection count
- Total collected
- Cash collection
- UPI collection
- Card collection
- Cheque collection
- Bank transfer collection
- Detailed payment transactions

dikhata hai.

> Monthly Excel month-wise actual received collections dikhata hai; ye monthly tuition due schedule nahi hai.

### Download process

1. Reports page kholein
2. Academic session select karein
3. Required class/quarter/admin filters select karein
4. **Monthly Excel** ya **Quarterly Excel** button click karein
5. Downloaded `.xlsx` file Excel mein open karein

---

## 11. Daily working process

### Day start

- Sahi current session verify karein
- Dashboard check karein
- Pending students check karein

### Fee collection ke samay

- Student identity verify karein
- Session verify karein
- Quarter select karein
- Amount aur payment mode verify karein
- Payment submit karein
- Receipt print karein

### Day end

- Dashboard par today’s collection verify karein
- Reports mein collector/payment mode check karein
- Monthly ya quarterly Excel backup download karein
- Cash amount ko application collection se match karein

---

## 12. Common problems aur solutions

### “Fee structure not found”

Check karein:

- Sahi session selected hai
- Student ki class sahi hai
- Us class aur session ka Fee Structure bana hua hai

### Transport fee nahi aa rahi

Check karein:

- Student ke liye transport Yes hai
- Valid route selected hai
- Route active hai
- Route ki monthly fee set hai

### Admission fee nahi aa rahi

- New student checkbox select karein
- Fee Structure mein Admission Fee check karein
- Q1 schedule verify karein

### Quarter click nahi ho raha

Quarter fully paid hone par click disabled rehna expected hai.

### Payment amount accept nahi ho raha

Check karein:

- Amount zero ya negative na ho
- Amount total pending se zyada na ho
- Selected quarter ka pending amount check karein
- Student ka transport route selected ho

### Report empty aa rahi

Check karein:

- Sahi session selected hai
- Quarter/class/admin filter bahut restrictive na ho
- Selected session mein payments available hon

### Student list mein fee zero dikh rahi

- Class/session fee structure check karein
- Student class aur session mapping verify karein

---

## 13. Data safety rules

- Password share na karein
- Har user apne account se login kare
- Student save karne se pehle details verify karein
- Payment submit karne se pehle amount verify karein
- Receipt number record mein rakhein
- Regularly Excel reports download karke backup rakhein
- Browser ya system ko payment submit hote samay force-close na karein
- Unknown `.env`, database ya server settings ko edit na karein

---

## 14. Quick setup checklist

- [ ] School settings complete
- [ ] Current academic session created
- [ ] Classes created
- [ ] Sections created
- [ ] Transport routes created
- [ ] Class/session fee structures created
- [ ] Admin users created
- [ ] Students added/imported
- [ ] Student discounts verified
- [ ] Transport selections verified
- [ ] Test fee payment completed
- [ ] Test receipt printed
- [ ] Monthly Excel tested
- [ ] Quarterly Excel tested

---

## 15. Quick fee collection checklist

- [ ] Correct student
- [ ] Correct academic session
- [ ] Correct class and section
- [ ] Admission checkbox checked if applicable
- [ ] Transport route correct
- [ ] Correct quarter selected
- [ ] Amount verified
- [ ] Payment mode verified
- [ ] Print Fee Quote tested (no save)
- [ ] Save Payment used for actual collection
- [ ] Receipt generated
- [ ] Receipt printed/given to payer
- [ ] Super Admin refund/correct tested (if applicable)

---

## 16. Support details

Application-related help ke liye:

```text
Contact Person:
Phone:
Email:
```

School apne support person ki details upar fill kar sakta hai.
