import React, { useState, useEffect } from "react";
import {
  Button,
  Stack,
  Image,
  Flex,
  Input,
  Box,
  Divider,
} from "@chakra-ui/react";
import algoliasearch from "algoliasearch";
import BeerCard from "./components/BeerCard";
import {
  Configure,
  InstantSearch,
  SearchBox,
  connectHits,
} from "react-instantsearch-dom";
import axios from "axios";

const searchClient = algoliasearch(
  "CXLC6HNNXB",
  "a2f56d56d2d456f27b0814278ac43163"
);

const index = searchClient.initIndex("beerIndex");

const Hits = ({ hits, highlightedItem, currentBeerToFind, setToAdd }) => (
  <Stack spacing={4} direction="row" align="center">
    {hits.map((hit, i) => {
      return (
        <Button
          key={hit.objectID}
          size={highlightedItem.code == `Digit${i + 1}` ? "lg" : "md"}
          colorScheme={highlightedItem.code == `Digit${i + 1}` ? "teal" : "red"}
          onClick={() => {
            console.log(hit);
            setToAdd({
              ...hit,
              title: hit.beer_name,
              vendor: hit.brewery.brewery_name,
              shopBeerId: currentBeerToFind.shopId,
            });
          }}
        >
          {hit.beer_name}
        </Button>
      );
    })}
  </Stack>
);

const CustomHits = connectHits(Hits);

const Main = () => {
  const [highlightedItem, setHighlightedItem] = useState([]);
  const [pendingBeers, setPendingBeers] = useState(0);
  const [currentBeerToFind, setCurrentBeerToFind] = useState([]);
  const [untappdBeers, setUntappdBeers] = useState([]);
  const [toAdd, setToAdd] = useState([]);

  useEffect(() => {
    document.addEventListener("keydown", (e) => {
      if (e.metaKey || e.ctrlKey) {
        e.preventDefault();
      }
      setHighlightedItem(e);
      //   console.log(e)
    });
  });

  useEffect(() => {
    if (
      (highlightedItem.metaKey || highlightedItem.ctrlKey) &&
      highlightedItem.code === "KeyS"
    ) {
      getBeer().then(() => {
        // setHighlightedItem([]);
      });
    }

    if (
      (highlightedItem.metaKey || highlightedItem.ctrlKey) &&
      highlightedItem.code === "KeyA"
    ) {
      addBeer({ ...toAdd, shopId: currentBeerToFind.shopId });
    }

    if (
      (highlightedItem.metaKey || highlightedItem.ctrlKey) &&
      highlightedItem.code === "KeyE"
    ) {
      excludeBeer(currentBeerToFind.shopId);
    }
  }, [highlightedItem]);

  //   useEffect(() => {
  //     getBeer();
  //   }, []);

  const getBeer = async () => {
    const result = await axios
      .get("http://localhost:8080/api/beers/one")
      .then((res) => {
        return res.data;
      })
      .then(({ rows, count }) => {
        let data = rows[0];

        setToAdd({ title: data.title, vendor: data.vendor, brewery: [] });
        setPendingBeers(count);
        setCurrentBeerToFind(data);
        return { ...count, ...rows };
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

  const indexBeer = async (beerId, brewId) => {
    const result = await axios
      .post("http://192.168.1.40/apis/listone.php", {
        beerId: beerId,
        brewId: brewId,
      })
      .then((res) => {
        return res.data;
      })
      .then((data) => {
        console.log(data);
        return data;
      });
    return result;
  };

  const addBeer = async (beerItem) => {
    const result = await axios
      .post(`http://localhost:8080/api/beers`, beerItem)
      .then((res) => {
        indexBeer(beerItem.bid, beerItem.brewery.brewery_id);

        setToAdd([]);
        setUntappdBeers([]);
        getBeer();

        return res.data;
      });

    return result;
  };

  const searchBeer = async (query) => {
    // let queryString = "?client_id=07A0DE00FEDC01C88968A3B4B07E833662FE0603&client_secret=A0CACFCBDE8F8B346EACCF4266F9627E0713038E&q=".urlencode($_GET['q']);
    let URL = `https://api.untappd.com/v4/search/beer`;
    axios
      .get(URL, {
        params: {
          client_id: "07A0DE00FEDC01C88968A3B4B07E833662FE0603",
          client_secret: "A0CACFCBDE8F8B346EACCF4266F9627E0713038E",
          q: query,
        },
      })
      .then((res) => {
        console.log(res);

        if (res.data.meta.code == 429) {
          console.log("apiOut");
        } else {
          setUntappdBeers(res.data);
        }
        console.log(res.data);
      });
  };

  return (
    <Flex>
      <Box>
        {pendingBeers}
        {currentBeerToFind.length !== 0 && (
          <BeerCard currentBeerToFind={currentBeerToFind} />
        )}
      </Box>
      <Box flex="1" padding={5}>
        <Stack spacing={4} direction="row" align="center">
          {/* <Button>{highlightedItem}</Button> */}

          <Button onClick={getBeer} colorScheme={"teal"} size="lg">
            Skip Beer
          </Button>
          <Button
            onClick={() => excludeBeer(currentBeerToFind.shopId)}
            colorScheme={"teal"}
            size="lg"
          >
            Exclude Item
          </Button>
        </Stack>
        <Stack spacing={4} direction="row" align="center">
          <Button
            onClick={() =>
              addBeer({ ...toAdd, shopId: currentBeerToFind.shopId })
            }
            colorScheme={"teal"}
            size="lg"
          >
            Add Item
          </Button>

          <Button
            onClick={() =>
              searchBeer(
                toAdd.vendor + " " + toAdd.title.replace(toAdd.vendor + " ", "")
              )
            }
            colorScheme={"teal"}
            size="lg"
          >
            Search Untappd
          </Button>
        </Stack>

        <Button>{toAdd.length !== 0 && toAdd.bid}</Button>

        <Button>{toAdd.length !== 0 && toAdd.brewery.brewery_id}</Button>

        <Input
          placeholder="Beer"
          value={toAdd.title}
          onChange={(e) => {
            setToAdd({ ...toAdd, title: e.target.value });
            setCurrentBeerToFind({
              ...currentBeerToFind,
              title: e.target.value,
            });
          }}
        />
        <Input
          placeholder="Brew"
          value={toAdd.vendor}
          onChange={(e) => {
            setToAdd({ ...toAdd, vendor: e.target.value });
            setCurrentBeerToFind({
              ...currentBeerToFind,
              vendor: e.target.value,
            });
          }}
        />
        <Button>{toAdd.length !== 0 && toAdd.beer_abv}</Button>
      </Box>
      <Box flex={1}>
        <InstantSearch searchClient={searchClient} indexName="beerIndex">
          <Configure hitsPerPage={10} analytics={false} />
          <SearchBox
            focusShortcuts={[]}
            defaultRefinement={currentBeerToFind.title}
          />
          <CustomHits
            highlightedItem={highlightedItem}
            currentBeerToFind={currentBeerToFind}
            setToAdd={setToAdd}
          />
        </InstantSearch>
        {untappdBeers.length !== 0 &&
          untappdBeers.response.beers.count !== 0 &&
          untappdBeers.response.beers.items
            .sort((a, b) => a.beer.beer_name.localeCompare(b.beer.beer_name))
            .map((item, i) => (
              <Button
                key={item.objectID}
                colorScheme={
                  highlightedItem.code == `Digit${i + 1}` ? "teal" : "red"
                }
                onClick={() => {
                  // console.log(item);
                  setToAdd({
                    ...item.beer,
                    brewery: item.brewery,
                    title: item.beer.beer_name,
                    vendor: item.brewery.brewery_name,
                    shopBeerId: currentBeerToFind.shopId,
                  });
                }}
              >
                {item.beer.beer_name}
              </Button>
            ))}
      </Box>
    </Flex>
  );
};

export default Main;
