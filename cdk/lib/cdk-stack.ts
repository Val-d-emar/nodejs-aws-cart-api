import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const cartApiLambda = new NodejsFunction(this, 'CartApiLambda', {
      runtime: lambda.Runtime.NODEJS_24_X,
      entry: path.join(__dirname, '../../src/main.serverless.ts'),
      handler: 'handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(15),

      projectRoot: path.join(__dirname, '../../'),
      depsLockFilePath: path.join(__dirname, '../../package-lock.json'),

      bundling: {
        minify: true,
        sourceMap: true,
      },
    });

    const api = new apigateway.LambdaRestApi(this, 'CartApi', {
      handler: cartApiLambda,
      proxy: true,
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['*'],
      },
    });

    new cdk.CfnOutput(this, 'CartApiUrl', {
      value: api.url,
    });
  }
}
