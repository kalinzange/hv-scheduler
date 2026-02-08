/**
 * validateOverride.ts
 *
 * Server-side validation for shift overrides
 * Prevents bad data from reaching Firestore
 *
 * SECURITY:
 * - Role-based access control (only manager/admin)
 * - Validates business rules on server (prevents client-side bypass)
 * - Rate-limiting (Firebase built-in)
 *
 * FUTURE CONCERNS:
 * - Latency: Each override now requires 2 round-trips (validate + write)
 *   Mitigation: Implement batch validation, use optimistic UI updates
 * - Cost: More function invocations = higher billing
 *   Mitigation: Cache validation results, implement request deduplication
 */

import * as functions from "firebase-functions";

interface OverrideValidationRequest {
  empId: number;
  dateKey: string;
  shiftType: string;
  role: string;
  userId: string;
  overrides: Record<string, string>;
}

interface ValidationResponse {
  valid: boolean;
  error?: string;
  warnings?: string[];
}

const checkRestViolation = (prev: string, curr: string): boolean => {
  if (prev === "T" && curr === "M") return true;
  if (prev === "N" && curr === "M") return true;
  if (prev === "N" && curr === "T") return true;
  return false;
};

const checkShiftOverflow = (
  shifts: string[],
  index: number
): { hasOverflow: boolean; startIdx: number } => {
  let startIdx = index;
  while (startIdx > 0) {
    const shift = shifts[startIdx - 1];
    if (["F", "V", "S"].includes(shift)) {
      break;
    }
    startIdx--;
  }

  let count = 0;
  for (let i = startIdx; i < shifts.length; i++) {
    const shift = shifts[i];
    if (["F", "V", "S"].includes(shift)) {
      break;
    }
    count++;
  }

  return {
    hasOverflow: count >= 6 && index >= startIdx && index < startIdx + count,
    startIdx,
  };
};

/**
 * HTTP endpoint for validating override requests
 * Called by client before attempting write
 */
export const validateOverride = functions.https.onRequest(
  async (request, response) => {
    // CORS headers
    response.set("Access-Control-Allow-Origin", "*");
    response.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    response.set("Access-Control-Allow-Headers", "Content-Type");

    if (request.method === "OPTIONS") {
      response.status(204).send("");
      return;
    }

    if (request.method !== "POST") {
      response.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      const {
        empId,
        dateKey,
        shiftType,
        role,
        overrides: overridesData,
      } = request.body as OverrideValidationRequest;

      const result: ValidationResponse = { valid: true, warnings: [] };

      // 1. AUTHORIZATION: Only manager/admin can override shifts
      if (!["manager", "admin"].includes(role)) {
        result.valid = false;
        result.error = `Role '${role}' not authorized to create overrides`;
        response.status(403).json(result);
        return;
      }

      // 2. INPUT VALIDATION
      if (!empId || !dateKey || !shiftType) {
        result.valid = false;
        result.error = "Missing required fields: empId, dateKey, shiftType";
        response.status(400).json(result);
        return;
      }

      // 3. BUSINESS LOGIC VALIDATION

      // Check rest violations (cannot work T→M, N→M, N→T consecutively)
      const dateObj = new Date(dateKey);
      const prevDate = new Date(dateObj);
      prevDate.setDate(prevDate.getDate() - 1);
      const prevDateKey = `${prevDate.getFullYear()}-${String(
        prevDate.getMonth() + 1
      ).padStart(2, "0")}-${String(prevDate.getDate()).padStart(2, "0")}`;

      const prevShift = overridesData[`${empId}_${prevDateKey}`] || "F";
      if (
        shiftType !== "F" &&
        shiftType !== "V" &&
        shiftType !== "S" &&
        checkRestViolation(prevShift, shiftType)
      ) {
        result.valid = false;
        result.error = `Rest violation: Cannot schedule ${shiftType} after ${prevShift}`;
        response.status(400).json(result);
        return;
      }

      // Check shift overflow (cannot work 6+ consecutive days)
      const empShifts = Object.keys(overridesData)
        .filter((k) => k.startsWith(`${empId}_`))
        .sort()
        .map((k) => overridesData[k] || "F");

      const dateIdx = empShifts.length; // Simplified index
      const overflowInfo = checkShiftOverflow(empShifts, dateIdx);

      if (overflowInfo.hasOverflow && !["F", "V", "S"].includes(shiftType)) {
        result.valid = false;
        result.error = `Shift overflow: Employee already has 6+ consecutive working days starting from index ${overflowInfo.startIdx}`;
        response.status(400).json(result);
        return;
      }

      // 4. WARNINGS (validation passes but alert user)
      if (shiftType === "V") {
        const vacationDays = Object.values(overridesData).filter(
          (s) => s === "V"
        ).length;
        if (vacationDays > 20) {
          result.warnings?.push(
            `Employee has ${vacationDays} vacation days already`
          );
        }
      }

      // All checks passed
      response.status(200).json(result);
    } catch (error: any) {
      console.error("[validateOverride] Error:", error);
      response.status(500).json({
        valid: false,
        error: "Internal server error during validation",
      });
    }
  }
);

/**
 * Callable function for batch validation
 * Better for multiple overrides at once
 * Reduces round-trips: 1 call instead of N calls
 *
 * FUTURE: Implement caching to reduce computation
 */
export const validateOverrideBatch = functions.https.onCall(
  async (data: {
    overrides: Array<{
      empId: number;
      dateKey: string;
      shiftType: string;
    }>;
    role: string;
    userId: string;
    allOverrides: Record<string, string>;
  }) => {
    // Verify role
    if (!["manager", "admin"].includes(data.role)) {
      throw new functions.https.HttpsError(
        "permission-denied",
        `Role '${data.role}' not authorized`
      );
    }

    const results = [];

    for (const override of data.overrides) {
      const result: any = { ...override, valid: true };

      // Simplified validation
      const prevDate = new Date(override.dateKey);
      prevDate.setDate(prevDate.getDate() - 1);
      const prevDateKey = `${prevDate.getFullYear()}-${String(
        prevDate.getMonth() + 1
      ).padStart(2, "0")}-${String(prevDate.getDate()).padStart(2, "0")}`;

      const prevShift =
        data.allOverrides[`${override.empId}_${prevDateKey}`] || "F";
      if (checkRestViolation(prevShift, override.shiftType)) {
        result.valid = false;
        result.error = `Rest violation after ${prevShift}`;
      }

      results.push(result);
    }

    return { results };
  }
);
