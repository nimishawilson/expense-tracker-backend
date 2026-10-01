import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'SplitConsistency' })
export class SplitConsistencyConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments) {
    const obj = args.object as { splitType?: unknown; participants?: unknown };
    return (obj.splitType !== undefined) === (obj.participants !== undefined);
  }

  defaultMessage() {
    return 'splitType and participants must both be provided together, or both omitted';
  }
}

export function SplitConsistency(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: SplitConsistencyConstraint,
    });
  };
}
