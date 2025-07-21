import { Box, Stack, Text } from '@chakra-ui/react';

export default function VoteInstructions() {
  return (
    <Box
      bg="blue.50"
      p={6}
      borderRadius="lg"
      borderLeft="4px solid"
      borderColor="blue.500"
    >
      <Stack gap={2}>
        <Text fontWeight="bold" color="blue.700">
          投票方法
        </Text>
        <Text color="blue.600" fontSize="sm">
          下の参加者の中から1人を選んで投票してください。自分自身に投票することも可能です。
          <br />
          または「ランダム選択」ボタンで参加者の中からランダムに1人を選択することもできます。
        </Text>
      </Stack>
    </Box>
  );
}
