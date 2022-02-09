import { Image, Box } from "@chakra-ui/react";

const BeerCard = ({ currentBeerToFind }) => {
  return (
    <Box maxW="sm" borderWidth="1px" borderRadius="lg" overflow="hidden">
      <Image
        maxW="sm"
        src={
          currentBeerToFind.images.length > 0 && currentBeerToFind.images[0].src
        }
      />

      <Box p="6">
        <Box
          mt="1"
          fontWeight="semibold"
          as="h4"
          lineHeight="tight"
          isTruncated
        >
          {currentBeerToFind.title}
        </Box>
        <Box>{currentBeerToFind.vendor}</Box>
        <Box display="flex" mt="2" alignItems="center">
          {currentBeerToFind.body_html.replace(/<[^>]+>/g, "")}
        </Box>
      </Box>
    </Box>
  );
};
export default BeerCard;
