import React, { useState, useEffect } from "react";
import { Button, Stack, Flex, Input, Box, Divider } from "@chakra-ui/react";
import algoliasearch from "algoliasearch";
import BeerCard from "./components/BeerCard";
import {
  Configure,
  InstantSearch,
  SearchBox,
  connectHits,
} from "react-instantsearch-dom";
import axios from "axios";
import { encode } from "blurhash";

const searchClient = algoliasearch(
  "CXLC6HNNXB",
  "a2f56d56d2d456f27b0814278ac43163"
);

const index = searchClient.initIndex("craftyBeer");

const loadImage = async (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (...args) => reject(args);
    img.src = src;
  });

const getImageData = (image) => {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0);
  return context.getImageData(0, 0, image.width, image.height);
};

const encodeImageToBlurhash = async (imageUrl) => {
  const image = await loadImage(imageUrl);
  const imageData = getImageData(image);
  return encode(imageData.data, imageData.width, imageData.height, 4, 4);
};

const Hits = ({ hits, highlightedItem, currentBeerToFind, setToAdd }) => (
  <div>
    {hits.map((hit, i) => {
      return (
        <Button
          style={{ margin: 5 }}
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
          {hit.beer_name}<br />{hit.brewery.brewery_name}
        </Button>
      );
    })}
  </div>
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
      setHighlightedItem(e);
    });
  });

  useEffect(() => {
    if (
      (highlightedItem.metaKey || highlightedItem.altKey) &&
      highlightedItem.code === "KeyS"
    ) {
      highlightedItem.preventDefault();
      getBeer().then(() => {
        // setHighlightedItem([]);
      });
    }

    if (
      (highlightedItem.metaKey || highlightedItem.altKey) &&
      highlightedItem.code === "KeyA"
    ) {
      highlightedItem.preventDefault();
      addBeer({
        ...toAdd,
        imageArr: currentBeerToFind.images,
        shopId: currentBeerToFind.shopId,
      });
    }

    if (
      (highlightedItem.metaKey || highlightedItem.altKey) &&
      highlightedItem.code === "KeyD"
    ) {
      highlightedItem.preventDefault();
      searchBeer(
        toAdd.vendor + " " + toAdd.title.replace(toAdd.vendor + " ", "")
      );
    }

    if (
      (highlightedItem.metaKey || highlightedItem.altKey) &&
      highlightedItem.code === "KeyE"
    ) {
      highlightedItem.preventDefault();
      excludeBeer(currentBeerToFind.shopId);
    }
  }, [highlightedItem]);

  // useEffect(() => {
  //   getBeer();
  // }, []);

  const getBeer = async () => {
    setUntappdBeers([]);
    const result = await axios
      .get("https://api.crafty.camp/api/beers/one")
      .then((res) => {
        return res.data;
      })
      .then(({ rows, count }) => {
        let data = rows[0];
        // console.log(data)
        setToAdd({
          title: data.title,
          vendor: data.vendor,
          shop: data.shop,
          handle: data.handle,
          brewery: [],
        });
        setPendingBeers(count);
        setCurrentBeerToFind(data);
        return { ...count, ...rows };
      });
    return result;
  };

  const excludeBeer = async (id) => {
    const result = await axios
      .put(`https://api.crafty.camp/api/beers/exclude/${id}`)
      .then((res) => {
        getBeer();
        return res.data;
      });
    return result;
  };

  const addImagesToDatabase = (item) => {};

  const addBeer = async (beerItem) => {
    const result = await axios
      .post(`https://api.crafty.camp/api/beers`, beerItem)
      .then((res) => {
        setToAdd([]);

        getBeer();

        return res.data;
      });
    beerItem.imageArr.forEach((item) => {
      addImagesToDatabase(item.src);
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
       Remaining: {pendingBeers}
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
              addBeer({
                ...toAdd,
                imageArr: currentBeerToFind.images,
                shopId: currentBeerToFind.shopId,
              })
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
        <Button>{toAdd.length !== 0 && toAdd.beer_abv}%</Button>
        <Button>£{toAdd.length !== 0 && currentBeerToFind.price}</Button>
        <Button>
          <a
            href={"https://" + toAdd.shop + "/" + toAdd.handle}
            target="_blank"
          >
            Visit shop
          </a>
        </Button>
      </Box>
      <Box flex={2}>
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
        <div>
          {untappdBeers.length !== 0 &&
            untappdBeers.response.beers.count !== 0 &&
            untappdBeers.response.beers.items
              .sort((a, b) => a.beer.beer_name.localeCompare(b.beer.beer_name))
              .map((item, i) => (
                <Button
                  style={{ margin: 5 }}
                  key={item.objectID}
                  colorScheme={"teal"}
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
                  {item.beer.beer_name}<br />{item.brewery.brewery_name}
                </Button>
              ))}
        </div>
      </Box>
    </Flex>
  );
};

export default Main;
