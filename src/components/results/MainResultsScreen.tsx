import { Stack } from '@chakra-ui/react';
import PageLayout from '@/components/PageLayout';
import ResultsHeader from './ResultsHeader';
import VoteStatusCard from './VoteStatusCard';
import VoteResultsList from './VoteResultsList';
import ResultsActions from './ResultsActions';
import { ResultsData } from '@/types/database';

interface MainResultsScreenProps {
  resultsData: ResultsData;
  timeRemaining: string | null;
  isRestarting: boolean;
  onRestartVoting: () => void;
}

export default function MainResultsScreen({
  resultsData,
  timeRemaining,
  isRestarting,
  onRestartVoting,
}: MainResultsScreenProps) {
  return (
    <PageLayout maxWidth="4xl" padding={8}>
      <Stack gap={8}>
        <ResultsHeader
          roomTitle={resultsData.room.title}
          roomStatus={resultsData.room.status}
          timeRemaining={timeRemaining}
          voteStatus={resultsData.voteStatus}
        />
        <VoteStatusCard
          voteStatus={resultsData.voteStatus}
          roomStatus={resultsData.room.status}
        />
        <ResultsActions
          isComplete={resultsData.voteStatus.isComplete}
          roomStatus={resultsData.room.status}
          isTimeExpired={timeRemaining === '期限切れ'}
          isRestarting={isRestarting}
          onRestartVoting={onRestartVoting}
        />
        <VoteResultsList
          results={resultsData.results}
          winners={resultsData.winners}
          votedCount={resultsData.voteStatus.votedCount}
        />
      </Stack>
    </PageLayout>
  );
}
