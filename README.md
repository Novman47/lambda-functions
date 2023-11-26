# lambda-functions
Real time Lambda-functions for node js devlopers

nodejs-snapshot-delete-lambda


The Lambda function fetches all EBS snapshots owned by the same account ('self') and also retrieves a list of active EC2 instances (running and stopped). For each snapshot, it checks if the associated volume (if exists) is not associated with any active instance. If it finds a stale snapshot, it deletes it, effectively optimizing storage costs.


nodejs-aws-config-lambda

AWS Config to detect compliant and non-compliant ec2 instances for below rule.
AWS Config will now continuously evaluate your EC2 instances against the rule you've created.

If any EC2 instance is found without monitoring enabled, the custom rule's Lambda function will mark it as non-compliant.