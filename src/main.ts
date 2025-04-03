import boxen from 'boxen';
import chalk from 'chalk';

// Define the global Error interface to extend the built-in Error constructor
declare global {
  interface ErrorConstructor {
    new(messageOrOptions?: string | ErrorDetails): Error;
  }
  
  // Add interfaces for specific error types
  interface TypeErrorConstructor {
    new(messageOrOptions?: string | ErrorDetails): TypeError;
  }
  interface ReferenceErrorConstructor {
    new(messageOrOptions?: string | ErrorDetails): ReferenceError;
  }
  interface SyntaxErrorConstructor {
    new(messageOrOptions?: string | ErrorDetails): SyntaxError;
  }
  interface RangeErrorConstructor {
    new(messageOrOptions?: string | ErrorDetails): RangeError;
  }
}

// Interface for general message data structure
interface MessageDetails {
  message?: string;
  details?: any;
  [key: string]: any;
}

// Interface for error-specific message data structure
interface ErrorDetails extends MessageDetails {
  code?: string | number;
}

// Base abstract class for all message types
// This class provides common functionality for formatting and displaying messages
// It also captures the call location for better debugging
abstract class MessageHandler {
  // Static properties to store the call location and instance of the message
  protected static locationInfo: string = '';
  protected static instance: MessageDetails;
  
  // Boxen options for formatting the output
  public static readonly boxenOptions = {
    padding: 1,
    width: process.stdout.columns - 10,
    borderStyle: "round" as const,
  };

  // Static method to capture the call location
  protected static captureCallLocation(): string {
    const obj: any = {};
    Error.captureStackTrace(obj);
    
    if (obj.stack) {
      const stackLines = obj.stack.split('\n');
      if (stackLines.length > 2) {
        return stackLines[3].trim();
      }
    }
    return 'Nie można określić lokalizacji';
  }
  
  // Static method to format additional information
  public static formatAdditionalInfo(details: any): string {
    if (!details) return '';
    
    return Object.entries(details)
      .filter(([key]) => key !== 'message')
      .map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${JSON.stringify(value)}`)
      .join('\n');
  }
}

// Info class for displaying informational messages
export class Info extends MessageHandler {
  // Static properties to store the call location and instance of the message
  public static readonly boxenOptions = {
    ...MessageHandler.boxenOptions,
    borderColor: 'blue' as const
  };

  // Constructor to initialize the Info message
  // It captures the call location and formats the message for display
  // It also handles the case where the message is a string or an object
  // Finally, it calls the display method to show the message
  constructor(data: MessageDetails | string) {
    super();
    Info.locationInfo = MessageHandler.captureCallLocation();
    
    if (typeof data === 'string') {
      Info.instance = { message: data };
    } else {
      Info.instance = data;
    }
    
    this.display();
  }
  
  // Method to display the Info message
  // It formats the message using boxen and chalk for better readability
  // It includes the title, message, additional information, and call location
  private display(): void {
    const title = chalk.bold.white.bgBlue(` Info - ${new Date().toLocaleString()} `);
    const message = chalk.white.blue(`Message: ${Info.instance.message || ''}`);
    const additionalInfo = MessageHandler.formatAdditionalInfo(Info.instance.details);
    
    console.log(
      boxen(
        `${title}\n\n${message}${additionalInfo ? '\n\n' + additionalInfo : ''}\n\n${Info.locationInfo}`,
        Info.boxenOptions
      )
    );
  }
}

// Warn class for displaying warning messages
export class Warn extends MessageHandler {
  // Static properties to store the call location and instance of the message
  public static readonly boxenOptions = {
    ...MessageHandler.boxenOptions,
    borderColor: 'yellow' as const
  };

  // Constructor to initialize the Warn message
  // It captures the call location and formats the message for display
  // It also handles the case where the message is a string or an object
  // Finally, it calls the display method to show the message
  constructor(data: MessageDetails | string) {
    super();
    Warn.locationInfo = MessageHandler.captureCallLocation();
    
    if (typeof data === 'string') {
      Warn.instance = { message: data };
    } else {
      Warn.instance = data;
    }
    
    this.display();
  }
  
  // Method to display the Warn message
  private display(): void {
    const title = chalk.bold.black.bgYellow(` Warning - ${new Date().toLocaleString()} `);
    const message = chalk.yellow(`Message: ${Warn.instance.message || ''}`);
    const additionalInfo = MessageHandler.formatAdditionalInfo(Warn.instance.details);
    
    console.log(
      boxen(
        `${title}\n\n${message}${additionalInfo ? '\n\n' + additionalInfo : ''}\n\n${Warn.locationInfo}`,
        Warn.boxenOptions
      )
    );
  }
}

// Debug class for displaying debug messages
export class Debug extends MessageHandler {
  // Static properties to store the call location and instance of the message
  public static readonly boxenOptions = {
    ...MessageHandler.boxenOptions,
    borderColor: 'green' as const
  };

  // Constructor to initialize the Debug message
  // It captures the call location and formats the message for display
  // It also handles the case where the message is a string or an object
  // Finally, it calls the display method to show the message
  constructor(data: MessageDetails | string) {
    super();
    Debug.locationInfo = MessageHandler.captureCallLocation();
    
    if (typeof data === 'string') {
      Debug.instance = { message: data };
    } else {
      Debug.instance = data;
    }
    
    this.display();
  }
  
  // Method to display the Debug message
  private display(): void {
    const title = chalk.bold.black.bgGreen(` Debug - ${new Date().toLocaleString()} `);
    const message = chalk.green(`Message: ${Debug.instance.message || ''}`);
    const additionalInfo = MessageHandler.formatAdditionalInfo(Debug.instance.details);
    
    console.log(
      boxen(
        `${title}\n\n${message}${additionalInfo ? '\n\n' + additionalInfo : ''}\n\n${Debug.locationInfo}`,
        Debug.boxenOptions
      )
    );
  }
}

// CustomError class for handling errors
// This class extends the built-in Error class and adds additional functionality
export class CustomError extends Error {
  details?: ErrorDetails;
  
  // Constructor to initialize the CustomError
  constructor(input: string | ErrorDetails) {
    let message: string;
    let details: ErrorDetails = {};
    
    if (typeof input === 'string') {
      message = input;
    } else {
      message = input.message || 'Unknown error';
      details = input;
    }
    
    super(message);
    this.details = details;
    
    this.name = this.constructor.name;
    
    ErrorHandler.handleError(this);
  }
}

// ErrorHandler class for managing error handling
// This class listens for uncaught exceptions and unhandled promise rejections and formats the error messages for display
export class ErrorHandler {
  // Static properties to store the call location and instance of the message
  private static instance: ErrorHandler;

  // Boxen options for formatting the output
  private static readonly boxenOptions = {
    ...MessageHandler.boxenOptions,
    borderColor: 'red' as const
  };
  
  // Private constructor to prevent instantiation
  private constructor() {
    process.on('uncaughtException', (error: Error) => {
      ErrorHandler.handleError(error);
    });
    
    process.on('unhandledRejection', (reason: any) => {
      ErrorHandler.handleError(reason instanceof Error ? reason : new Error(String(reason)));
    });
  }
  
  // Static method to get the singleton instance of ErrorHandler
  // This method ensures that only one instance of ErrorHandler is created
  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }
  
  // Static method to handle errors
  public static handleError(error: Error & { details?: ErrorDetails }): void {
    const errorTitle = chalk.bold.white.bgRed(` Error - ${new Date().toLocaleString()} `);
    const message = chalk.bold.red(`Message: ${error.message}`);
    
    let additionalInfo = '';
    if (error.details) {
      additionalInfo = MessageHandler.formatAdditionalInfo(error.details);
    }
    
    let location = '';
    if (error.stack) {
      const stackLines = error.stack.split('\n');
      if (stackLines.length > 1) {
        location = stackLines[1].trim();
      }
    }
    
    console.log(
      boxen(
        `${errorTitle}\n\n${message}${additionalInfo ? '\n\n' + additionalInfo : ''}\n\n${location}`,
        ErrorHandler.boxenOptions
      )
    );
  }
}

// Initialize the ErrorHandler singleton instance
// This ensures that the error handling is set up when the module is loaded
// and that any uncaught exceptions or unhandled promise rejections are handled by the ErrorHandler
ErrorHandler.getInstance();

// Save the original Error constructor
const OriginalError = Error;

// Override the global Error constructor
global.Error = function(message?: string | ErrorDetails) {
  // If called with 'new', return a new instance of CustomError
  if (new.target) {
    return new CustomError(message || '');
  }
  
  // When called without 'new', return the original Error
  return OriginalError(typeof message === 'string' ? message : message?.message);
} as any;

// Copy prototype and static properties
Object.setPrototypeOf(global.Error, OriginalError);
Object.setPrototypeOf(global.Error.prototype, OriginalError.prototype);

// Retain important static properties
global.Error.captureStackTrace = OriginalError.captureStackTrace;
global.Error.stackTraceLimit = OriginalError.stackTraceLimit;

// Export CustomError as ErronautError
export const ErronautError = CustomError;
// Helper function to override specific error constructors
function overrideErrorConstructor(constructor: any, name: string) {
  const Original = constructor;
  
  (globalThis as any)[name] = function(message?: string | ErrorDetails) {
    if (new.target) {
      const err = new CustomError(message || '');
      err.name = name;
      
      ErrorHandler.handleError(err);
      
      return err;
    }
    return Original(typeof message === 'string' ? message : message?.message);
  };
  
  // Copy prototype and static properties
  Object.setPrototypeOf((globalThis as any)[name], Original);
  Object.setPrototypeOf((globalThis as any)[name].prototype, Original.prototype);
}

// Override other error constructors
overrideErrorConstructor(TypeError, 'TypeError');
overrideErrorConstructor(ReferenceError, 'ReferenceError');
overrideErrorConstructor(SyntaxError, 'SyntaxError');
overrideErrorConstructor(RangeError, 'RangeError');
overrideErrorConstructor(URIError, 'URIError');
overrideErrorConstructor(EvalError, 'EvalError');

// Add error handling for promise-catch
const originalPromiseCatch = Promise.prototype.catch;
Promise.prototype.catch = function(...args) {
  if (args.length === 0) {
    return originalPromiseCatch.call(this, (err) => {
      ErrorHandler.handleError(err);
      throw err;
    });
  }
  return originalPromiseCatch.apply(this, args);
};

// Add error handling for setTimeout and setInterval
const originalSetTimeout = global.setTimeout;
global.setTimeout = function(callback, ms, ...args) {
  const wrappedCallback = function() {
    try {
      callback.apply(this, args);
    } catch (err) {
      ErrorHandler.handleError(err);
      throw err;
    }
  };
  return originalSetTimeout(wrappedCallback, ms);
} as any;

const originalSetInterval = global.setInterval;
global.setInterval = function(callback, ms, ...args) {
  const wrappedCallback = function() {
    try {
      callback.apply(this, args);
    } catch (err) {
      ErrorHandler.handleError(err);
      throw err;
    }
  };
  return originalSetInterval(wrappedCallback, ms);
} as any;