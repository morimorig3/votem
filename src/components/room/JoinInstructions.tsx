import {
  Box,
  Text,
} from '@chakra-ui/react';

export default function JoinInstructions() {
  return (
    <Box
      p={4}
      bg="yellow.50"
      borderRadius="md"
      borderLeft="4px solid"
      borderColor="yellow.500"
    >
      <Text fontWeight="bold" color="yellow.700" mb={2}>
        参加方法
      </Text>
      <Text color="yellow.600" fontSize="sm">
        このURLをチームメンバーに共有して、みんなで参加してもらいましょう！
      </Text>
    </Box>
  );
}