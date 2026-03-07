import SocketService from './SocketService';
import KafkaService from './KafkaService';
import pino from 'pino';

const logger = pino();

class TranscriptService {
    async streamChunk(userId: string, interviewId: string, chunk: string) {
        SocketService.emitToUser(userId, 'transcript:chunk', {
            interviewId,
            chunk,
            timestamp: new Date().toISOString()
        });
    }

    async finalizeTranscript(userId: string, interviewId: string, fullText: string, metadata: any = {}) {
        const transcriptEvent = {
            userId,
            interviewId,
            fullText,
            metadata,
            timestamp: new Date().toISOString()
        };

        // Publish to Kafka for long-term storage/analytics
        await KafkaService.publish('transcript-events', transcriptEvent);

        // Notify client completion
        SocketService.emitToUser(userId, 'transcript:completed', {
            interviewId,
            status: 'success'
        });

        logger.info({ interviewId, userId }, 'Transcript finalized and published to Kafka');
    }
}

export default new TranscriptService();
