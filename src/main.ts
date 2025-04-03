import boxen from 'boxen';
import chalk from 'chalk';

interface MessageDetails {
  message?: string;
  details?: any;
  [key: string]: any;
}

interface ErrorDetails extends MessageDetails {
  code?: string | number;
}

abstract class MessageHandler {
  protected static locationInfo: string = '';
  protected static instance: MessageDetails;
  
  public static readonly boxenOptions = {
    padding: 1,
    width: process.stdout.columns - 10,
    borderStyle: "round" as const,
  };

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
  
  public static formatAdditionalInfo(details: any): string {
    if (!details) return '';
    
    return Object.entries(details)
      .filter(([key]) => key !== 'message')
      .map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${JSON.stringify(value)}`)
      .join('\n');
  }
}

export class Info extends MessageHandler {
  public static readonly boxenOptions = {
    ...MessageHandler.boxenOptions,
    borderColor: 'blue' as const
  };

  constructor(data: MessageDetails) {
    super();
    Info.locationInfo = MessageHandler.captureCallLocation();
    
    if (typeof data === 'string') {
      Info.instance = { message: data };
    } else {
      Info.instance = data;
    }
    
    this.display();
  }
  
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

export class Warn extends MessageHandler {
  public static readonly boxenOptions = {
    ...MessageHandler.boxenOptions,
    borderColor: 'yellow' as const
  };

  constructor(data: MessageDetails) {
    super();
    Warn.locationInfo = MessageHandler.captureCallLocation();
    
    if (typeof data === 'string') {
      Warn.instance = { message: data };
    } else {
      Warn.instance = data;
    }
    
    this.display();
  }
  
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

export class Debug extends MessageHandler {
  public static readonly boxenOptions = {
    ...MessageHandler.boxenOptions,
    borderColor: 'green' as const
  };

  constructor(data: MessageDetails) {
    super();
    Debug.locationInfo = MessageHandler.captureCallLocation();
    
    if (typeof data === 'string') {
      Debug.instance = { message: data };
    } else {
      Debug.instance = data;
    }
    
    this.display();
  }
  
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

export class CustomError extends Error {
  details?: ErrorDetails;
  
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

export class ErrorHandler {
  private static instance: ErrorHandler;
  
  private static readonly boxenOptions = {
    ...MessageHandler.boxenOptions,
    borderColor: 'red' as const
  };
  
  private constructor() {
    process.on('uncaughtException', (error: Error) => {
      ErrorHandler.handleError(error);
    });
    
    process.on('unhandledRejection', (reason: any) => {
      ErrorHandler.handleError(reason instanceof Error ? reason : new Error(String(reason)));
    });
  }
  
  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }
  
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

ErrorHandler.getInstance();

export const ErronautError = CustomError;