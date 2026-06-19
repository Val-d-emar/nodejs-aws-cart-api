import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
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

    const cartApiLambda = new lambda.Function(this, 'CartApiLambda', {
      runtime: lambda.Runtime.NODEJS_24_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../'), {
        exclude: [
          'cdk',
          'README.md',
          '.git',
          'tsconfig.json',
          'tsconfig.build.json',
          'nest-cli.json',
          'node_modules/typescript',
          'node_modules/jest',
          'node_modules/eslint',
          'node_modules/prettier',
          'node_modules/@nestjs/cli',
          'node_modules/@nestjs/schematics',
          'node_modules/@types',
          'node_modules/esbuild',
        ],
      }),
      handler: 'dist/src/lambda.handler',

      memorySize: 512,
      timeout: cdk.Duration.seconds(15),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      allowPublicSubnet: true,

      environment: {
        DB_HOST: dbHost,
        DB_PORT: dbPort,
        DB_USERNAME: dbUser,
        DB_PASSWORD: dbPassword,
        DB_DATABASE: dbDatabase,
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
