const AWS = require('aws-sdk');
const ec2 = new AWS.EC2();

exports.handler = async (event, context) => {
    try {
        // Get all EBS snapshots
        const snapshots = await ec2.describeSnapshots({ OwnerIds: ['self'] }).promise();

        // Get all active EC2 instance IDs
        const instancesResponse = await ec2.describeInstances({ Filters: [{ Name: 'instance-state-name', Values: ['running'] }] }).promise();
        const activeInstanceIds = new Set();

        instancesResponse.Reservations.forEach(reservation => {
            reservation.Instances.forEach(instance => {
                activeInstanceIds.add(instance.InstanceId);
            });
        });

        // Iterate through each snapshot and delete if it's not attached to any volume or the volume is not attached to a running instance
        for (const snapshot of snapshots.Snapshots) {
            const snapshotId = snapshot.SnapshotId;
            const volumeId = snapshot.VolumeId;

            if (!volumeId) {
                // Delete the snapshot if it's not attached to any volume
                await ec2.deleteSnapshot({ SnapshotId: snapshotId }).promise();
                console.log(`Deleted EBS snapshot ${snapshotId} as it was not attached to any volume.`);
            } else {
                // Check if the volume still exists
                try {
                    const volumeResponse = await ec2.describeVolumes({ VolumeIds: [volumeId] }).promise();
                    if (!volumeResponse.Volumes[0].Attachments.length) {
                        await ec2.deleteSnapshot({ SnapshotId: snapshotId }).promise();
                        console.log(`Deleted EBS snapshot ${snapshotId} as it was taken from a volume not attached to any running instance.`);
                    }
                } catch (error) {
                    if (error.code === 'InvalidVolume.NotFound') {
                        // The volume associated with the snapshot is not found (it might have been deleted)
                        await ec2.deleteSnapshot({ SnapshotId: snapshotId }).promise();
                        console.log(`Deleted EBS snapshot ${snapshotId} as its associated volume was not found.`);
                    } else {
                        throw error;
                    }
                }
            }
        }
        
        return 'Snapshot cleanup completed.';
    } catch (error) {
        console.error('Error occurred:', error);
        throw error;
    }
};
