import React, { ReactNode } from 'react';
import { Box, Container } from '@chakra-ui/react';
import Navbar from './Navbar';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <Box minH="100vh" bg="gray.50">
      <Navbar />
      <Container maxW="container.xl" pt={8} pb={10}>
        {children}
      </Container>
    </Box>
  );
};

export default Layout;
