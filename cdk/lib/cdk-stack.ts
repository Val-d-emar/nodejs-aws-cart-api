import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromLookup(this, 'Vpc', { isDefault: true });

    const rdsSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(
      this,
      'RdsSG',
      'sg-0b7fdc0b06000faef',
    );

    const dbPassword = process.env.DB_PASSWORD || 'my_secure_password';

    const dbHost = process.env.DB_HOST || 'localhost';

    const dbUser = process.env.DB_USERNAME || 'cart_user';

    const dbDatabase = process.env.DB_DATABASE || 'cart_db';

    const dbPort = process.env.DB_PORT || '5432';

    const cartApiLambda = new NodejsFunction(this, 'CartApiLambda', {
      runtime: lambda.Runtime.NODEJS_24_X,
      entry: path.join(__dirname, '../../src/main.serverless.ts'),
      handler: 'handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(15),

      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      allowPublicSubnet: true,

      projectRoot: path.join(__dirname, '../../'),
      depsLockFilePath: path.join(__dirname, '../../package-lock.json'),

      environment: {
        DB_HOST: dbHost,
        DB_PORT: dbPort,
        DB_USERNAME: dbUser,
        DB_PASSWORD: dbPassword,
        DB_DATABASE: dbDatabase,
      },

      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: [
          '@nestjs/websockets/socket-module',
          '@nestjs/microservices/microservices-module',
          '@nestjs/microservices',
          'class-validator',
          'class-transformer',
        ],
      },
    });

    rdsSecurityGroup.connections.allowFrom(
      cartApiLambda,
      ec2.Port.tcp(parseInt(dbPort, 10)),
    );

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
