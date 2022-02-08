import React, { useState, useEffect } from "react";
import { Button, Stack, Image, Flex } from "@chakra-ui/react";

import { Box } from "@chakra-ui/react";
import algoliasearch from "algoliasearch/lite";
import {
  Configure,
  InstantSearch,
  SearchBox,
  connectHits,
} from "react-instantsearch-dom";
import axios from "axios";

const searchClient = algoliasearch(
  "CXLC6HNNXB",
  "1d458805bfa7587bdb408a6e3e082c2c"
);

const Hits = ({ hits }) => (
  <Stack spacing={4} direction="row" align="center">
    {hits.map((hit) => (
      <Button key={hit.objectID} colorScheme={"teal"}>
        {hit.beer_name}
      </Button>
    ))}
  </Stack>
);

const CustomHits = connectHits(Hits);

const Main = () => {
  const [highlightedItem, setHighlightedItem] = useState();
  const [pendingBeers, setPendingBeers] = useState(0);
  const [currentBeerToFind, setCurrentBeerToFind] = useState([]);

  useEffect(() => {
    document.addEventListener("keydown", (e) => {
      setHighlightedItem(e.code);
    });
  });

  useEffect(() => {
    getBeer();
  }, []);

  const getBeer = async () => {
    const result = await axios
      .get("http://localhost:8080/api/beers/one")
      .then((res) => {
        setPendingBeers(res.data.count);
        setCurrentBeerToFind(res.data.rows[0]);
        return res.data;
      });
    return result;
  };

  const excludeBeer = async (id) => {
    const result = await axios
      .put(`http://localhost:8080/api/beers/exclude/${id}`)
      .then((res) => {
        getBeer();
        return res.data;
      });
    return result;
  };

  // Sample card from Airbnb

  function AirbnbExample() {
    return (
      <Box maxW="sm" borderWidth="1px" borderRadius="lg" overflow="hidden">
        <Image
          src={
            currentBeerToFind.images.length > 0 &&
            currentBeerToFind.images[0].src
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
  }

  return (
    <Flex>
      <Box>
        {pendingBeers}
        {currentBeerToFind.length != 0 && <AirbnbExample />}
      </Box>
      <Box flex="1">
        <Stack spacing={4} direction="row" align="center">
          <Button>lol</Button>

          <Button onClick={getBeer} colorScheme={"teal"} size="lg">
            Skip Beer
          </Button>
          <Button
            onClick={() => excludeBeer(currentBeerToFind.shopId)}
            colorScheme={"teal"}
            size="lg"
          >
            Exculde Item {currentBeerToFind.shopId}
          </Button>
          {/* <div>lol{highlightedItem}</div> */}
        </Stack>
        <InstantSearch searchClient={searchClient} indexName="beerIndex">
          <Configure hitsPerPage={10} analytics={false} />
          <SearchBox defaultRefinement={currentBeerToFind.title} />
          <CustomHits />
        </InstantSearch>
      </Box>
    </Flex>
  );
};

export default Main;
