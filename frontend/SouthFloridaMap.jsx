import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Icon } from 'leaflet';
import {
  Button,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  Input,
  FormControl,
  FormLabel,
  Box,
  VStack,
  Text,
} from '@chakra-ui/react';
import axios from 'axios';

const housingIcon = new Icon({
  iconUrl: 'https://img.icons8.com/plasticine/100/exterior.png',
  iconSize: [38, 45], 
  iconAnchor: [22, 94],
  popupAnchor: [-3, -76],
});

const SouthFloridaMap = () => {
  const [listings, setListings] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedListing, setSelectedListing] = useState(null);
  const [newListing, setNewListing] = useState({
    title: '',
    description: '',
    latitude: '',
    longitude: '',
  });

  useEffect(() => {
    // Fetch listings from the database when the component loads
    axios.get('http://localhost:5000/api/listings')
      .then((response) => {
        setListings(response.data.listings);
      })
      .catch((error) => {
        console.error('Error fetching listings:', error);
      });
  }, []);

  const handleDrawerOpen = (listing) => {
    setSelectedListing(listing);
    onOpen();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewListing({ ...newListing, [name]: value });
  };

  const handleAddListing = () => {
    const { title, description, latitude, longitude } = newListing;
    axios.post('http://localhost:5000/api/listings', {
      title,
      description,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
    })
      .then((response) => {
        setListings([...listings, { id: response.data.id, title, description, latitude: parseFloat(latitude), longitude: parseFloat(longitude) }]);
        setNewListing({
          title: '',
          description: '',
          latitude: '',
          longitude: '',
        });
      })
      .catch((error) => {
        console.error('Error adding listing:', error);
      });
  };

  const southFloridaCenter = [26.1336, -80.1226];

  return (
    <>
      <MapContainer center={southFloridaCenter} zoom={12} style={{ height: '500px', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
        />
        {listings.map((listing, index) => (
          <Marker
            key={index}
            position={[listing.latitude, listing.longitude]}
            icon={housingIcon}
          >
            <Popup>
              <VStack spacing={'auto'}>
              <strong>{listing.title}</strong><br />
              <Text>{listing.description}</Text>
              <Button mt={0} colorScheme="teal" size="xs" onClick={() => handleDrawerOpen(listing)}>
                More Details
              </Button></VStack>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <Box mt={4} p={4} bg="gray.100" borderRadius="md" shadow="md">
        <VStack spacing={4}>
          <FormControl id="title" isRequired>
            <FormLabel>Title</FormLabel>
            <Input bg='white' name="title" value={newListing.title} onChange={handleInputChange} />
          </FormControl>
          <FormControl id="description" isRequired>
            <FormLabel>Description</FormLabel>
            <Input bg='white' name="description" value={newListing.description} onChange={handleInputChange} />
          </FormControl>
          <FormControl id="latitude" isRequired>
            <FormLabel>Latitude</FormLabel>
            <Input bg='white' name="latitude" type="number" value={newListing.latitude} onChange={handleInputChange} />
          </FormControl>
          <FormControl id="longitude" isRequired>
            <FormLabel>Longitude</FormLabel>
            <Input bg='white' name="longitude" type="number" value={newListing.longitude} onChange={handleInputChange} />
          </FormControl>
          <Button colorScheme="blue" onClick={handleAddListing}>Add Listing</Button>
        </VStack>
      </Box>

      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>{selectedListing?.title}</DrawerHeader>
          <DrawerBody>
            <p>{selectedListing?.description}</p>
            {/* Add more details here as needed */}
          </DrawerBody>
          <DrawerFooter>
            <Button variant="outline" mr={3} onClick={onClose}>
              Close
            </Button>
            {/* Add any other action buttons here */}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default SouthFloridaMap;
