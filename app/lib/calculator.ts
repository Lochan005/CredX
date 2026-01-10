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
