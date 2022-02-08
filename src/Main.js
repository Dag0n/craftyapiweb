import React, { useState, useEffect } from "react";
import { Button, ButtonGroup } from "@chakra-ui/react";
import { Stack, HStack, VStack } from "@chakra-ui/react";
import algoliasearch from "algoliasearch/lite";
import { InstantSearch, SearchBox, Hits } from "react-instantsearch-dom";
import axios from "axios";

const searchClient = algoliasearch(
  "CXLC6HNNXB",
  "1d458805bfa7587bdb408a6e3e082c2c"
);

const Main = () => {
  const [highlightedItem, setHighlightedItem] = useState();
  const [pendingBeers, setPendingBeers] = useState(0);
  useEffect(() => {
    document.addEventListener("keydown", (e) => {
      setHighlightedItem(e.code);
    });
  });

  useEffect(() => {
    getBeer().then(a =>setPendingBeers(a.count));
  }, []);

  const getBeer = async () => {
    const result = await axios
      .get("http://localhost:8080/api/beers/one")
      .then((res) => {
        return res.data;
      });
      return result
  };

  const arr = [
    { key: 1, text: 1 },
    { key: 2, text: 2 },
    { key: 3, text: 3 },
    { key: 4, text: 4 },
    { key: 5, text: 5 },
  ];

  return (
    <div>
      {/* <InstantSearch searchClient={searchClient} indexName="beerIndex"> */}
      {/* <SearchBox /> */}
      {/* <Hits /> */}
      {/* </InstantSearch> */}
      {pendingBeers}

      <Button onClick={getBeer} colorScheme={"teal"} size="lg">
        Get Beer
      </Button>

      <Stack spacing={4} direction="row" align="center">
        {arr.map((item, i) => {
          return (
            <Button
              key={i}
              colorScheme={highlightedItem != `Digit${i}` ? "teal" : "red"}
              size="lg"
            >
              Button {i}
            </Button>
          );
        })}
        <div>lol{highlightedItem}</div>
      </Stack>
    </div>
  );
};

export default Main;
