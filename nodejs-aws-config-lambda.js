const AWS = require('aws-sdk');
const ec2 = new AWS.EC2();
const config = new AWS.ConfigService();

exports.handler = async (event, context) => {
    try {
        // Get the specific EC2 instance ID
        const instanceId = JSON.parse(event.invokingEvent).configurationItem.instanceId;
        
        // Get complete Instance details
        const instance = (await ec2.describeInstances({ InstanceIds: [instanceId] }).promise()).Reservations[0].Instances[0];

        let complianceStatus = 'COMPLIANT';
        let annotation = 'Detailed monitoring is enabled.';

        // Check if detailed monitoring is enabled
        if (instance.Monitoring.State !== 'enabled') {
            complianceStatus = 'NON_COMPLIANT';
            annotation = 'Detailed monitoring is not enabled.';
        }

        const evaluation = {
            ComplianceResourceType: 'AWS::EC2::Instance',
            ComplianceResourceId: instanceId,
            ComplianceType: complianceStatus,
            Annotation: annotation,
            OrderingTimestamp: event.notificationCreationTime
        };

        const putEvaluationsParams = {
            Evaluations: [evaluation],
            ResultToken: event.resultToken
        };

        await config.putEvaluations(putEvaluationsParams).promise();

        return 'Evaluation sent to AWS Config.';
    } catch (error) {
        console.error('Error occurred:', error);
        throw error;
    }
};
