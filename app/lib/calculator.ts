import Decimal from 'decimal.js';

/**
 * Calculate monthly interest rate from annual rate
 * @param annualRate - Annual interest rate as a percentage (e.g., 10 for 10%)
 * @returns Monthly interest rate as a decimal
 */
export function calculateMonthlyRate(annualRate: number): Decimal {
  const annual = new Decimal(annualRate).div(100);
  return annual.div(12);
}

/**
 * Calculate EMI (Equated Monthly Installment)
 * Formula: P × i × (1+i)^N / [(1+i)^N - 1]
 * @param principal - Loan principal amount
 * @param annualRate - Annual interest rate as a percentage
 * @param tenureMonths - Loan tenure in months
 * @returns EMI amount
 */
export function calculateEMI(
  principal: number,
  annualRate: number,
  tenureMonths: number
): Decimal {
  const P = new Decimal(principal);
  const i = calculateMonthlyRate(annualRate);
  const N = new Decimal(tenureMonths);
  
  const onePlusI = new Decimal(1).plus(i);
  const onePlusIToN = onePlusI.pow(N);
  const numerator = P.times(i).times(onePlusIToN);
  const denominator = onePlusIToN.minus(1);
  
  return numerator.div(denominator);
}

/**
 * Calculate outstanding principal after some months have been paid
 * Formula: P × [(1+i)^N - (1+i)^k] / [(1+i)^N - 1]
 * @param originalPrincipal - Original loan principal
 * @param annualRate - Annual interest rate as a percentage
 * @param originalTenure - Original loan tenure in months
 * @param monthsPaid - Number of months already paid
 * @returns Outstanding principal amount
 */
export function calculateOutstandingPrincipal(
  originalPrincipal: number,
  annualRate: number,
  originalTenure: number,
  monthsPaid: number
): Decimal {
  const P = new Decimal(originalPrincipal);
  const i = calculateMonthlyRate(annualRate);
  const N = new Decimal(originalTenure);
  const k = new Decimal(monthsPaid);
  
  const onePlusI = new Decimal(1).plus(i);
  const onePlusIToN = onePlusI.pow(N);
  const onePlusIToK = onePlusI.pow(k);
  
  const numerator = P.times(onePlusIToN.minus(onePlusIToK));
  const denominator = onePlusIToN.minus(1);
  
  return numerator.div(denominator);
}

/**
 * Calculate new tenure after lump-sum prepayment, keeping EMI same
 * Formula: N' = ln(E / (E - P_after × i)) / ln(1+i)
 * where P_after = outstanding - prepayment
 * @param outstandingPrincipal - Outstanding principal before prepayment
 * @param annualRate - Annual interest rate as a percentage
 * @param emi - Current EMI amount
 * @param prepaymentAmount - Lump-sum prepayment amount
 * @returns New tenure in months
 */
export function calculateNewTenure(
  outstandingPrincipal: number,
  annualRate: number,
  emi: number,
  prepaymentAmount: number
): Decimal {
  const P_after = new Decimal(outstandingPrincipal).minus(prepaymentAmount);
  const i = calculateMonthlyRate(annualRate);
  const E = new Decimal(emi);
  
  // If prepayment exceeds outstanding principal or results in zero/negative principal
  if (P_after.lte(0)) {
    return new Decimal(0);
  }
  
  const onePlusI = new Decimal(1).plus(i);
  const P_afterTimesI = P_after.times(i);
  const denominatorInner = E.minus(P_afterTimesI);
  
  // Check if denominator is positive (valid scenario)
  // If EMI is not sufficient to cover interest, tenure cannot be calculated
  if (denominatorInner.lte(0)) {
    return new Decimal(0);
  }
  
  const ratio = E.div(denominatorInner);
  const lnRatio = ratio.ln();
  const lnOnePlusI = onePlusI.ln();
  
  return lnRatio.div(lnOnePlusI);
}

/**
 * Calculate interest saved due to prepayment
 * @param emi - EMI amount
 * @param originalRemainingTenure - Remaining tenure before prepayment in months
 * @param newTenure - New tenure after prepayment in months
 * @param prepaymentAmount - Lump-sum prepayment amount
 * @returns Interest saved amount
 */
export function calculateInterestSaved(
  emi: number,
  originalRemainingTenure: number,
  newTenure: number,
  prepaymentAmount: number
): Decimal {
  const E = new Decimal(emi);
  const originalRemaining = new Decimal(originalRemainingTenure);
  const newTenureDecimal = new Decimal(newTenure);
  const prepayment = new Decimal(prepaymentAmount);
  
  const totalCostWithoutPrepay = E.times(originalRemaining);
  const totalCostWithPrepay = E.times(newTenureDecimal).plus(prepayment);
  
  return totalCostWithoutPrepay.minus(totalCostWithPrepay);
}

/**
 * Main function to calculate complete prepayment scenario
 * @param originalPrincipal - Original loan principal
 * @param annualRate - Annual interest rate as a percentage
 * @param originalTenure - Original loan tenure in months
 * @param monthsPaid - Number of months already paid
 * @param prepaymentAmount - Lump-sum prepayment amount
 * @returns Object containing all calculated values
 */
export function calculatePrepaymentScenario(
  originalPrincipal: number,
  annualRate: number,
  originalTenure: number,
  monthsPaid: number,
  prepaymentAmount: number
): {
  emi: number;
  outstandingPrincipal: number;
  remainingTenure: number;
  newTenureAfterPrepay: number;
  interestSaved: number;
  tenureReduced: number;
  totalCostWithoutPrepay: number;
  totalCostWithPrepay: number;
} {
  // Calculate EMI based on original loan terms
  const emi = calculateEMI(originalPrincipal, annualRate, originalTenure);
  
  // Calculate outstanding principal after monthsPaid
  const outstandingPrincipal = calculateOutstandingPrincipal(
    originalPrincipal,
    annualRate,
    originalTenure,
    monthsPaid
  );
  
  // Remaining tenure before prepayment
  const remainingTenure = originalTenure - monthsPaid;
  
  // Calculate new tenure after prepayment
  const newTenureAfterPrepayDecimal = calculateNewTenure(
    outstandingPrincipal.toNumber(),
    annualRate,
    emi.toNumber(),
    prepaymentAmount
  );
  const newTenureAfterPrepay = Math.max(0, Math.ceil(newTenureAfterPrepayDecimal.toNumber()));
  
  // Calculate interest saved
  const interestSaved = calculateInterestSaved(
    emi.toNumber(),
    remainingTenure,
    newTenureAfterPrepay,
    prepaymentAmount
  );
  
  // Calculate tenure reduction
  const tenureReduced = remainingTenure - newTenureAfterPrepay;
  
  // Calculate total costs
  const totalCostWithoutPrepay = emi.times(remainingTenure);
  const totalCostWithPrepay = emi.times(newTenureAfterPrepay).plus(prepaymentAmount);
  
  return {
    emi: emi.toNumber(),
    outstandingPrincipal: outstandingPrincipal.toNumber(),
    remainingTenure,
    newTenureAfterPrepay,
    interestSaved: interestSaved.toNumber(),
    tenureReduced,
    totalCostWithoutPrepay: totalCostWithoutPrepay.toNumber(),
    totalCostWithPrepay: totalCostWithPrepay.toNumber(),
  };
}

/**
 * Calculate prepayment scenario with "Reduce EMI" option
 * Instead of reducing tenure, keeps the same remaining tenure but reduces EMI
 * Formula for new EMI: E' = P_after × i × (1+i)^N_remaining / [(1+i)^N_remaining - 1]
 * @param originalPrincipal - Original loan principal
 * @param annualRate - Annual interest rate as a percentage
 * @param originalTenure - Original loan tenure in months
 * @param monthsPaid - Number of months already paid
 * @param prepaymentAmount - Lump-sum prepayment amount
 * @returns Object containing all calculated values
 */
export function calculatePrepaymentScenario1B(
  originalPrincipal: number,
  annualRate: number,
  originalTenure: number,
  monthsPaid: number,
  prepaymentAmount: number
): {
  emi: number;
  newEmi: number;
  emiReduction: number;
  outstandingPrincipal: number;
  remainingTenure: number;
  interestSaved: number;
  totalCostWithoutPrepay: number;
  totalCostWithPrepay: number;
  monthlyBenefit: number;
} {
  // Calculate original EMI based on original loan terms
  const emi = calculateEMI(originalPrincipal, annualRate, originalTenure);
  
  // Calculate outstanding principal after monthsPaid
  const outstandingPrincipal = calculateOutstandingPrincipal(
    originalPrincipal,
    annualRate,
    originalTenure,
    monthsPaid
  );
  
  // Remaining tenure stays the same (original tenure - months paid)
  const remainingTenure = originalTenure - monthsPaid;
  
  // Calculate principal after prepayment
  const P_after = outstandingPrincipal.minus(prepaymentAmount);
  
  // Check if prepayment exceeds outstanding principal
  if (P_after.lte(0)) {
    // Invalid scenario - prepayment exceeds or equals outstanding
    return {
      emi: emi.toNumber(),
      newEmi: 0,
      emiReduction: emi.toNumber(),
      outstandingPrincipal: outstandingPrincipal.toNumber(),
      remainingTenure,
      interestSaved: 0,
      totalCostWithoutPrepay: emi.times(remainingTenure).toNumber(),
      totalCostWithPrepay: prepaymentAmount,
      monthlyBenefit: emi.toNumber(),
    };
  }
  
  // Calculate new EMI after prepayment
  // Formula: E' = P_after × i × (1+i)^N_remaining / [(1+i)^N_remaining - 1]
  const i = calculateMonthlyRate(annualRate);
  const N_remaining = new Decimal(remainingTenure);
  
  const onePlusI = new Decimal(1).plus(i);
  const onePlusIToN = onePlusI.pow(N_remaining);
  const numerator = P_after.times(i).times(onePlusIToN);
  const denominator = onePlusIToN.minus(1);
  
  // Check if denominator is valid (should be positive for valid loan)
  if (denominator.lte(0)) {
    return {
      emi: emi.toNumber(),
      newEmi: 0,
      emiReduction: emi.toNumber(),
      outstandingPrincipal: outstandingPrincipal.toNumber(),
      remainingTenure,
      interestSaved: 0,
      totalCostWithoutPrepay: emi.times(remainingTenure).toNumber(),
      totalCostWithPrepay: prepaymentAmount,
      monthlyBenefit: emi.toNumber(),
    };
  }
  
  const newEmi = numerator.div(denominator);
  
  // Calculate EMI reduction
  const emiReduction = emi.minus(newEmi);
  
  // Calculate monthly benefit (same as EMI reduction)
  const monthlyBenefit = emiReduction;
  
  // Calculate total costs
  const totalCostWithoutPrepay = emi.times(remainingTenure);
  const totalCostWithPrepay = newEmi.times(remainingTenure).plus(prepaymentAmount);
  
  // Calculate interest saved
  const interestSaved = totalCostWithoutPrepay.minus(totalCostWithPrepay);
  
  return {
    emi: emi.toNumber(),
    newEmi: newEmi.toNumber(),
    emiReduction: emiReduction.toNumber(),
    outstandingPrincipal: outstandingPrincipal.toNumber(),
    remainingTenure,
    interestSaved: interestSaved.toNumber(),
    totalCostWithoutPrepay: totalCostWithoutPrepay.toNumber(),
    totalCostWithPrepay: totalCostWithPrepay.toNumber(),
    monthlyBenefit: monthlyBenefit.toNumber(),
  };
}

/**
 * Calculate scenario for monthly extra payments on top of EMI
 * User pays extra amount every month, reducing tenure
 * Formula for new tenure: N' = ln((E + extra) / ((E + extra) - P_outstanding × i)) / ln(1+i)
 * @param originalPrincipal - Original loan principal
 * @param annualRate - Annual interest rate as a percentage
 * @param originalTenure - Original loan tenure in months
 * @param monthsPaid - Number of months already paid
 * @param monthlyExtraPayment - Extra amount paid each month on top of EMI
 * @returns Object containing all calculated values
 */
export function calculateScenario2(
  originalPrincipal: number,
  annualRate: number,
  originalTenure: number,
  monthsPaid: number,
  monthlyExtraPayment: number
): {
  emi: number;
  effectiveMonthlyPayment: number;
  outstandingPrincipal: number;
  remainingTenure: number;
  newTenure: number;
  tenureReduced: number;
  interestSaved: number;
  totalExtraPaid: number;
  totalCostWithoutExtra: number;
  totalCostWithExtra: number;
} {
  // Calculate original EMI based on original loan terms
  const emi = calculateEMI(originalPrincipal, annualRate, originalTenure);
  
  // Calculate outstanding principal after monthsPaid
  const outstandingPrincipal = calculateOutstandingPrincipal(
    originalPrincipal,
    annualRate,
    originalTenure,
    monthsPaid
  );
  
  // Remaining tenure before extra payments
  const remainingTenure = originalTenure - monthsPaid;
  
  // Effective monthly payment (EMI + extra)
  const effectiveMonthlyPayment = emi.plus(monthlyExtraPayment);
  
  // Calculate new tenure after extra payments
  // Formula: N' = ln((E + extra) / ((E + extra) - P_outstanding × i)) / ln(1+i)
  const i = calculateMonthlyRate(annualRate);
  const E_plus_extra = effectiveMonthlyPayment;
  const P_outstanding = outstandingPrincipal;
  
  // Check if extra payment is valid
  if (monthlyExtraPayment <= 0) {
    // No extra payment, tenure stays the same
    const totalCostWithoutExtra = emi.times(remainingTenure);
    const totalCostWithExtra = emi.times(remainingTenure);
    return {
      emi: emi.toNumber(),
      effectiveMonthlyPayment: emi.toNumber(),
      outstandingPrincipal: outstandingPrincipal.toNumber(),
      remainingTenure,
      newTenure: remainingTenure,
      tenureReduced: 0,
      interestSaved: 0,
      totalExtraPaid: 0,
      totalCostWithoutExtra: totalCostWithoutExtra.toNumber(),
      totalCostWithExtra: totalCostWithExtra.toNumber(),
    };
  }
  
  // Check if effective payment is sufficient to cover interest
  const P_outstandingTimesI = P_outstanding.times(i);
  const denominatorInner = E_plus_extra.minus(P_outstandingTimesI);
  
  if (denominatorInner.lte(0)) {
    // Effective payment not sufficient to cover interest
    return {
      emi: emi.toNumber(),
      effectiveMonthlyPayment: effectiveMonthlyPayment.toNumber(),
      outstandingPrincipal: outstandingPrincipal.toNumber(),
      remainingTenure,
      newTenure: 0,
      tenureReduced: remainingTenure,
      interestSaved: 0,
      totalExtraPaid: 0,
      totalCostWithoutExtra: emi.times(remainingTenure).toNumber(),
      totalCostWithExtra: new Decimal(0).toNumber(),
    };
  }
  
  const onePlusI = new Decimal(1).plus(i);
  const ratio = E_plus_extra.div(denominatorInner);
  const lnRatio = ratio.ln();
  const lnOnePlusI = onePlusI.ln();
  
  const newTenureDecimal = lnRatio.div(lnOnePlusI);
  const newTenure = Math.max(0, Math.ceil(newTenureDecimal.toNumber()));
  
  // Calculate tenure reduction
  const tenureReduced = remainingTenure - newTenure;
  
  // Calculate total extra paid
  const totalExtraPaid = new Decimal(monthlyExtraPayment).times(newTenure);
  
  // Calculate total costs
  const totalCostWithoutExtra = emi.times(remainingTenure);
  const totalCostWithExtra = effectiveMonthlyPayment.times(new Decimal(newTenure));
  
  // Calculate interest saved
  const interestSaved = totalCostWithoutExtra.minus(totalCostWithExtra);
  
  return {
    emi: emi.toNumber(),
    effectiveMonthlyPayment: effectiveMonthlyPayment.toNumber(),
    outstandingPrincipal: outstandingPrincipal.toNumber(),
    remainingTenure,
    newTenure,
    tenureReduced,
    interestSaved: interestSaved.toNumber(),
    totalExtraPaid: totalExtraPaid.toNumber(),
    totalCostWithoutExtra: totalCostWithoutExtra.toNumber(),
    totalCostWithExtra: totalCostWithExtra.toNumber(),
  };
}

/**
 * Calculate Scenario 3: Prepay + Refinance comparison
 * Compares 4 options: Stay, Prepay Only, Refinance Only, Prepay + Refinance
 * @param originalPrincipal - Original loan principal
 * @param currentRate - Current annual interest rate as a percentage
 * @param originalTenure - Original loan tenure in months
 * @param monthsPaid - Number of months already paid
 * @param prepaymentAmount - Lump-sum prepayment amount (for options A and C)
 * @param newRate - New refinance annual interest rate as a percentage
 * @param refinanceCost - Processing fees, legal costs etc. (rolled into loan for options B and C)
 * @param newTenure - Tenure for refinanced loan in months (usually same as remaining)
 * @returns Object containing comparison data for all 4 options
 */
export function calculateScenario3(
  originalPrincipal: number,
  currentRate: number,
  originalTenure: number,
  monthsPaid: number,
  prepaymentAmount: number,
  newRate: number,
  refinanceCost: number,
  newTenure: number
): {
  emi: number;
  outstandingPrincipal: number;
  remainingTenure: number;
  stay: {
    totalCost: number;
    totalInterest: number;
    monthlyPayment: number;
    tenure: number;
    hasBenefit: boolean;
    status?: string;
  };
  optionA: {
    totalCost: number;
    totalInterest: number;
    monthlyPayment: number;
    tenure: number;
    hasBenefit: boolean;
    status?: string;
  };
  optionB: {
    totalCost: number;
    totalInterest: number;
    monthlyPayment: number;
    tenure: number;
    hasBenefit: boolean;
    status?: string;
  };
  optionC: {
    totalCost: number;
    totalInterest: number;
    monthlyPayment: number;
    tenure: number;
    hasBenefit: boolean;
    status?: string;
  };
  bestOption: 'stay' | 'A' | 'B' | 'C';
  maxSavings: number;
} {
  // Calculate original EMI
  const emi = calculateEMI(originalPrincipal, currentRate, originalTenure);
  
  // Calculate outstanding principal after monthsPaid
  const outstandingPrincipal = calculateOutstandingPrincipal(
    originalPrincipal,
    currentRate,
    originalTenure,
    monthsPaid
  );
  
  // Remaining tenure
  const remainingTenure = originalTenure - monthsPaid;
  
  // Already paid amount
  const alreadyPaid = emi.times(monthsPaid);
  
  // Monthly rates
  const i_current = calculateMonthlyRate(currentRate);
  const i_new = calculateMonthlyRate(newRate);
  
  // Option: Stay (do nothing)
  const stayMonthlyPayment = emi;
  const stayTenure = remainingTenure;
  const stayFuturePayments = emi.times(stayTenure);
  const stayTotalCost = alreadyPaid.plus(stayFuturePayments);
  const stayTotalInterest = stayTotalCost.minus(originalPrincipal);
  
  // Option A: Prepay Only
  let optionA_totalCost = alreadyPaid;
  let optionA_monthlyPayment = emi;
  let optionA_tenure = remainingTenure;
  let optionA_totalInterest = new Decimal(0);
  let optionA_hasBenefit = false;
  let optionA_status: string | undefined = undefined;
  
  if (prepaymentAmount > 0 && prepaymentAmount < outstandingPrincipal.toNumber()) {
    const P_after = outstandingPrincipal.minus(prepaymentAmount);
    const P_afterTimesI = P_after.times(i_current);
    const denominatorInner = emi.minus(P_afterTimesI);
    
    if (denominatorInner.gt(0)) {
      const onePlusI = new Decimal(1).plus(i_current);
      const ratio = emi.div(denominatorInner);
      const lnRatio = ratio.ln();
      const lnOnePlusI = onePlusI.ln();
      const newTenureDecimal = lnRatio.div(lnOnePlusI);
      optionA_tenure = Math.max(0, Math.ceil(newTenureDecimal.toNumber()));
      optionA_monthlyPayment = emi;
      const optionA_futurePayments = emi.times(optionA_tenure);
      optionA_totalCost = alreadyPaid.plus(optionA_futurePayments).plus(prepaymentAmount);
      optionA_totalInterest = optionA_totalCost.minus(originalPrincipal);
      optionA_hasBenefit = optionA_totalCost.lt(stayTotalCost);
    } else {
      // Invalid scenario
      optionA_tenure = 0;
      optionA_totalCost = alreadyPaid.plus(prepaymentAmount);
      optionA_totalInterest = optionA_totalCost.minus(originalPrincipal);
      optionA_hasBenefit = false;
      optionA_status = "Invalid scenario";
    }
  } else {
    // No prepayment or invalid amount - same as stay
    optionA_tenure = remainingTenure;
    optionA_totalCost = stayTotalCost;
    optionA_totalInterest = stayTotalInterest;
    optionA_hasBenefit = false;
    optionA_status = prepaymentAmount === 0 ? "No benefit (same as Stay)" : "Invalid prepayment amount";
  }
  
  // Option B: Refinance Only
  const refinanceCostDecimal = new Decimal(refinanceCost);
  const P_refi_B = outstandingPrincipal.plus(refinanceCostDecimal);
  const onePlusI_new = new Decimal(1).plus(i_new);
  const onePlusI_newToN = onePlusI_new.pow(newTenure);
  const optionB_emi = P_refi_B.times(i_new).times(onePlusI_newToN).div(onePlusI_newToN.minus(1));
  
  const optionB_monthlyPayment = optionB_emi;
  const optionB_tenure = newTenure;
  const optionB_futurePayments = optionB_emi.times(newTenure);
  const optionB_totalCost = alreadyPaid.plus(optionB_futurePayments);
  const optionB_totalInterest = optionB_totalCost.minus(originalPrincipal);
  
  // Check if Option B has benefit (new rate must be less than current rate)
  const optionB_hasBenefit = newRate < currentRate && optionB_totalCost.lt(stayTotalCost);
  const optionB_status: string | undefined = newRate >= currentRate ? "No benefit (rate not lower)" : undefined;
  
  // Option C: Prepay + Refinance
  const P_after_C = outstandingPrincipal.minus(prepaymentAmount);
  const P_refi_C = P_after_C.plus(refinanceCostDecimal);
  
  // Check if P_refi_C is valid (positive)
  let optionC_totalCost = alreadyPaid;
  let optionC_monthlyPayment = emi;
  let optionC_tenure = remainingTenure;
  let optionC_totalInterest = new Decimal(0);
  let optionC_hasBenefit = false;
  let optionC_status: string | undefined = undefined;
  
  // If prepayment = 0, Option C is same as Option B
  if (prepaymentAmount === 0) {
    optionC_totalCost = optionB_totalCost;
    optionC_monthlyPayment = optionB_monthlyPayment;
    optionC_tenure = optionB_tenure;
    optionC_totalInterest = optionB_totalInterest;
    optionC_hasBenefit = false;
    optionC_status = "Same as Option B (no prepayment)";
  } else if (P_refi_C.gt(0) && prepaymentAmount < outstandingPrincipal.toNumber()) {
    const onePlusI_new_C = new Decimal(1).plus(i_new);
    const onePlusI_newToN_C = onePlusI_new_C.pow(newTenure);
    const optionC_emi = P_refi_C.times(i_new).times(onePlusI_newToN_C).div(onePlusI_newToN_C.minus(1));
    
    optionC_monthlyPayment = optionC_emi;
    optionC_tenure = newTenure;
    const optionC_futurePayments = optionC_emi.times(newTenure);
    optionC_totalCost = alreadyPaid.plus(optionC_futurePayments).plus(prepaymentAmount);
    optionC_totalInterest = optionC_totalCost.minus(originalPrincipal);
    
    // Option C has benefit if new rate < current rate AND it's better than Option A
    if (newRate >= currentRate) {
      optionC_hasBenefit = false;
      optionC_status = "No benefit (rate not lower)";
    } else {
      optionC_hasBenefit = optionC_totalCost.lt(optionA_totalCost);
    }
  } else {
    // Invalid scenario - fallback to stay
    optionC_tenure = remainingTenure;
    optionC_totalCost = stayTotalCost;
    optionC_totalInterest = stayTotalInterest;
    optionC_hasBenefit = false;
    optionC_status = "Invalid scenario";
  }
  
  // Find best option based on rules
  let bestOption: 'stay' | 'A' | 'B' | 'C';
  let maxSavings: number;
  
  // Rule 1: If prepayment = 0 AND refinance saves money → Best is "B" (not C)
  if (prepaymentAmount === 0) {
    if (newRate < currentRate && optionB_totalCost.lt(stayTotalCost)) {
      bestOption = 'B';
      maxSavings = stayTotalCost.toNumber() - optionB_totalCost.toNumber();
    } else {
      // Rule 2: If prepayment = 0 AND refinance doesn't save → Best is "Stay"
      bestOption = 'stay';
      maxSavings = 0;
    }
  }
  // Rule 3: If newRate >= currentRate AND prepayment > 0 → Best is "A"
  else if (newRate >= currentRate && prepaymentAmount > 0) {
    if (optionA_hasBenefit) {
      bestOption = 'A';
      maxSavings = stayTotalCost.toNumber() - optionA_totalCost.toNumber();
    } else {
      bestOption = 'stay';
      maxSavings = 0;
    }
  }
  // Rule 4: If newRate >= currentRate AND prepayment = 0 → Best is "Stay"
  // (This is already handled above, but keeping for clarity)
  else if (newRate >= currentRate && prepaymentAmount === 0) {
    bestOption = 'stay';
    maxSavings = 0;
  }
  // Rule 5: Otherwise compare all valid options fairly, pick lowest cost
  else {
    const costs: { [key: string]: number } = {
      stay: stayTotalCost.toNumber(),
      A: optionA_totalCost.toNumber(),
    };
    
    // Only include Option B if new rate < current rate
    if (newRate < currentRate) {
      costs.B = optionB_totalCost.toNumber();
    }
    
    // Only include Option C if prepayment > 0
    if (prepaymentAmount > 0) {
      costs.C = optionC_totalCost.toNumber();
    }
    
    const validOptions = Object.keys(costs) as Array<'stay' | 'A' | 'B' | 'C'>;
    bestOption = validOptions.reduce((a, b) => costs[a] < costs[b] ? a : b);
    maxSavings = stayTotalCost.toNumber() - costs[bestOption];
  }
  
  return {
    emi: emi.toNumber(),
    outstandingPrincipal: outstandingPrincipal.toNumber(),
    remainingTenure,
    stay: {
      totalCost: stayTotalCost.toNumber(),
      totalInterest: stayTotalInterest.toNumber(),
      monthlyPayment: stayMonthlyPayment.toNumber(),
      tenure: stayTenure,
      hasBenefit: true, // Stay is always a valid baseline
      status: undefined,
    },
    optionA: {
      totalCost: optionA_totalCost.toNumber(),
      totalInterest: optionA_totalInterest.toNumber(),
      monthlyPayment: optionA_monthlyPayment.toNumber(),
      tenure: optionA_tenure,
      hasBenefit: optionA_hasBenefit,
      status: optionA_status,
    },
    optionB: {
      totalCost: optionB_totalCost.toNumber(),
      totalInterest: optionB_totalInterest.toNumber(),
      monthlyPayment: optionB_monthlyPayment.toNumber(),
      tenure: optionB_tenure,
      hasBenefit: optionB_hasBenefit,
      status: optionB_status,
    },
    optionC: {
      totalCost: optionC_totalCost.toNumber(),
      totalInterest: optionC_totalInterest.toNumber(),
      monthlyPayment: optionC_monthlyPayment.toNumber(),
      tenure: optionC_tenure,
      hasBenefit: optionC_hasBenefit,
      status: optionC_status,
    },
    bestOption,
    maxSavings,
  };
}
