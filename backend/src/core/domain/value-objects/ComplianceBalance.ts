export class ComplianceBalance {
  private constructor(readonly value: number) {}

  static of(value: number): ComplianceBalance {
    return new ComplianceBalance(value);
  }

  isSurplus(): boolean {
    return this.value > 0;
  }

  isDeficit(): boolean {
    return this.value < 0;
  }

  isCompliant(): boolean {
    return this.value === 0;
  }
}
