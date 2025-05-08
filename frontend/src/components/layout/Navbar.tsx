import React from 'react';
import {
  Box,
  Flex,
  Button,
  HStack,
  IconButton,
  useDisclosure,
  useColorModeValue,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
} from '@chakra-ui/react';
import { Link, useLocation } from 'react-router-dom';
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons';

// Define navigation items
interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/' },
  { label: 'Sessions', href: '/sessions' },
  { label: 'Calendar', href: '/calendar' },
  { label: 'Patients', href: '/patients' },
];

// NavLink component for navigation items
const NavLink: React.FC<{ item: NavItem; onClick?: () => void }> = ({ item, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === item.href;
  const hoverBgColor = useColorModeValue('gray.100', 'gray.700');
  
  return (
    <Link 
      to={item.href} 
      style={{ textDecoration: 'none' }}
      onClick={onClick}
    >
      <Button
        variant="ghost"
        colorScheme="brand"
        size="md"
        fontWeight={isActive ? "bold" : "normal"}
        borderBottom={isActive ? "2px solid" : "none"}
        borderRadius="0"
        _hover={{
          textDecoration: 'none',
          bg: hoverBgColor,
        }}
      >
        {item.label}
      </Button>
    </Link>
  );
};

// Logo component
const Logo: React.FC = () => (
  <Box
    fontWeight="bold"
    fontSize="xl"
    color="brand.500"
    cursor="pointer"
  >
    <Link to="/" style={{ textDecoration: 'none' }}>
      PsychTrack
    </Link>
  </Box>
);

// Main Navbar component
const Navbar: React.FC = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const bgColor = useColorModeValue('white', 'gray.800');
  
  return (
    <Box as="nav" bg={bgColor} boxShadow="sm" position="sticky" top={0} zIndex={10}>
      <Flex
        h="16"
        alignItems="center"
        justifyContent="space-between"
        maxW="container.xl"
        mx="auto"
        px={4}
      >
        <Logo />

        {/* Desktop Navigation */}
        <HStack spacing={4} display={{ base: 'none', md: 'flex' }}>
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.label} item={item} />
          ))}
        </HStack>

        {/* Mobile Navigation Button */}
        <IconButton
          display={{ base: 'flex', md: 'none' }}
          onClick={onOpen}
          icon={<HamburgerIcon />}
          variant="ghost"
          aria-label="Open menu"
          size="lg"
        />
      </Flex>

      {/* Mobile Navigation Drawer */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="xs">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">Menu</DrawerHeader>
          <DrawerBody>
            <VStack spacing={4} align="stretch" pt={4}>
              {NAV_ITEMS.map((item) => (
                <NavLink 
                  key={item.label} 
                  item={item} 
                  onClick={onClose}
                />
              ))}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default Navbar;
