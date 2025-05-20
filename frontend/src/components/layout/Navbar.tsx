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
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  Text,
  Divider,
  useToast
} from '@chakra-ui/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
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
  const navigate = useNavigate();
  const toast = useToast();
  
  // Get auth store
  const { user: currentUser, logout } = useAuthStore();
  
  // Handle logout
  const handleLogout = () => {
    // Use the store's logout function which updates state AND clears localStorage
    logout();
    
    toast({
      title: 'Logged out successfully',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    
    // Force navigation to login page
    navigate('/login', { replace: true });
  };
  
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
          
          {/* User Menu with Logout */}
          {currentUser && (
            <Menu>
              <MenuButton
                as={Button}
                rounded={'full'}
                variant={'link'}
                cursor={'pointer'}
                minW={0}
              >
                <HStack>
                  <Avatar
                    size={'sm'}
                    name={currentUser.username}
                    bg="brand.500"
                    color="white"
                  />
                  <Text display={{ base: 'none', md: 'flex' }}>
                    {currentUser.username}
                  </Text>
                </HStack>
              </MenuButton>
              <MenuList>
                <MenuItem as={Link} to="/profile">Profile</MenuItem>
                <MenuItem as={Link} to="/settings">Settings</MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </MenuList>
            </Menu>
          )}
          
          {/* Login button if not logged in */}
          {!currentUser && (
            <Button
              as={Link}
              to="/login"
              colorScheme="brand"
              variant="solid"
            >
              Login
            </Button>
          )}
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
              
              {/* Mobile Logout Button */}
              {currentUser && (
                <>
                  <Divider />
                  <Button
                    colorScheme="brand"
                    variant="outline"
                    onClick={() => {
                      onClose();
                      handleLogout();
                    }}
                  >
                    Logout
                  </Button>
                </>
              )}
              
              {/* Mobile Login Button */}
              {!currentUser && (
                <Button
                  as={Link}
                  to="/login"
                  colorScheme="brand"
                  onClick={onClose}
                >
                  Login
                </Button>
              )}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default Navbar;
