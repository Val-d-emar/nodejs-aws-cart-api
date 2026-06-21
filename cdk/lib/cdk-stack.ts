import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as dotenv from 'dotenv';

dotenv.config();
export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const ebDomain = process.env.EB_URL || 'localhost';

    const distribution = new cloudfront.Distribution(
      this,
      'CartApiDistribution',
      {
        defaultBehavior: {
          origin: new origins.HttpOrigin(ebDomain, {
            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
          }),

          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,

          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,

          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,

          originRequestPolicy:
            cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        },
      },
    );

    new cdk.CfnOutput(this, 'CloudFrontApiUrl', {
      value: `https://${distribution.distributionDomainName}`,
    });
  }
}
