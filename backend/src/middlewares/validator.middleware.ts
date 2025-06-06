import { body, validationResult, ValidationChain } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// Validator updated to only expect 'problemDescription' and 'systemInfoText' as optional strings.
// No JSON parsing or object validation for systemInfo.
export const validateDiagnosticData: ValidationChain[] = [
  body('systemInfoText')
    .optional()
    .isString().withMessage('systemInfoText doit être une chaîne de caractères.')
    .trim(),

  body('problemDescription')
    .optional()
    .isString().withMessage('problemDescription doit être une chaîne de caractères.')
    .trim()
    .escape(),
];

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('[validator.middleware] Validation errors:', JSON.stringify(errors.array(), null, 2));
    return res.status(400).json({ 
      message: 'Erreurs de validation des données.',
      errors: errors.array() 
    });
  }
  next();
};

// Combiner les validateurs et le gestionnaire d'erreurs en un seul middleware
export const validateAndHandle = [
  ...validateDiagnosticData,
  handleValidationErrors
];
