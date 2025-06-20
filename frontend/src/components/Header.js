import React, { useState } from "react";
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Container,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Drawer,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  useTheme,
  useMediaQuery,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Brightness4,
  Brightness7,
  AdminPanelSettings,
} from "@mui/icons-material";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AnimatedLogo from "./AnimatedLogo";
import MD5 from "crypto-js/md5";

const Header = ({ mode, toggleColorMode, user }) => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  // Check if user is admin
  const isAdmin = user?.role === "admin";

  const navItems = [
    { label: "Home", path: "/" },
    { label: "About", path: "/about" },
    { label: "Contact", path: "/contact" },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setLogoutDialogOpen(false);
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const drawer = (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <AnimatedLogo
          size={32}
          color={
            theme.palette.mode === "dark" ? "#fff" : theme.palette.grey[50]
          }
          className="nav-logo"
        />
        <Typography variant="h6" sx={{ ml: 1, fontWeight: 700 }}>
          hMERN.app
        </Typography>
      </Box>

      <List sx={{ flexGrow: 1, px: 2 }}>
        {navItems.map((item) => (
          <ListItem
            key={item.label}
            component={Link}
            to={item.path}
            selected={location.pathname === item.path}
            sx={{
              color: "inherit",
              textDecoration: "none",
              borderRadius: 1,
              mb: 1,
              "&.Mui-selected": {
                backgroundColor: "primary.main",
                color: "white",
                "&:hover": {
                  backgroundColor: "primary.dark",
                },
              },
            }}
          >
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
      </List>

      {!isAuthenticated && (
        <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
          <Button
            component={Link}
            to="/login"
            fullWidth
            color="inherit"
            variant="outlined"
            sx={{
              mb: 1,
              borderRadius: 1,
              "&:hover": {
                backgroundColor: "primary.main",
                color: "white",
                borderColor: "primary.main",
              },
            }}
          >
            Login
          </Button>
          <Button
            component={Link}
            to="/register"
            fullWidth
            color="primary"
            variant="contained"
            sx={{
              borderRadius: 1,
              "&:hover": {
                backgroundColor: "primary.dark",
              },
            }}
          >
            Register
          </Button>
        </Box>
      )}
    </Box>
  );

  return (
    <>
      <AppBar position="sticky">
        <Container maxWidth="lg">
          <Toolbar disableGutters>
            {isMobile && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}

            <Typography
              variant="h6"
              noWrap
              component={Link}
              to="/"
              sx={{
                mr: 2,
                display: { xs: "none", md: "flex" },
                fontWeight: 700,
                color: "inherit",
                textDecoration: "none",
                alignItems: "center",
                gap: 1,
              }}
            >
              <AnimatedLogo
                size={32}
                color={
                  theme.palette.mode === "dark"
                    ? "#fff"
                    : theme.palette.grey[50]
                }
                className="nav-logo"
              />
              hMERN.app
            </Typography>

            {!isMobile && (
              <Box sx={{ flexGrow: 1, display: "flex", gap: 2 }}>
                {navItems.map((item) => (
                  <Button
                    key={item.label}
                    component={Link}
                    to={item.path}
                    sx={{
                      color: "inherit",
                      textDecoration: "none",
                      borderRadius: 1,
                      "&:hover": {
                        backgroundColor: "primary.main",
                        color: "white",
                      },
                      ...(location.pathname === item.path && {
                        backgroundColor: "primary.dark",
                        color: "white",
                        "&:hover": {
                          backgroundColor: "primary.dark",
                        },
                      }),
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
              </Box>
            )}

            <Box
              sx={{
                flexGrow: 0,
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <IconButton onClick={toggleColorMode} color="inherit">
                {theme.palette.mode === "dark" ? (
                  <Brightness7 />
                ) : (
                  <Brightness4 />
                )}
              </IconButton>

              {!isMobile && !isAuthenticated && (
                <>
                  <Button
                    component={Link}
                    to="/login"
                    color="inherit"
                    variant="outlined"
                    size="small"
                    sx={{
                      borderRadius: 1,
                      "&:hover": {
                        backgroundColor: "primary.main",
                        color: "white",
                        borderColor: "primary.main",
                      },
                      ...(location.pathname === "/login" && {
                        backgroundColor: "primary.dark",
                        color: "white",
                        borderColor: "primary.dark",
                        "&:hover": {
                          backgroundColor: "primary.dark",
                          borderColor: "primary.dark",
                        },
                      }),
                    }}
                  >
                    Login
                  </Button>
                  <Button
                    component={Link}
                    to="/register"
                    color="primary"
                    variant="contained"
                    size="small"
                    sx={{
                      borderRadius: 1,
                      "&:hover": {
                        backgroundColor: "primary.dark",
                      },
                    }}
                  >
                    Register
                  </Button>
                </>
              )}

              {isAuthenticated && (
                <>
                  <Tooltip title="Open settings">
                    <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                      <Avatar
                        alt={user?.name || "User"}
                        src={`https://www.gravatar.com/avatar/${MD5(
                          user?.email
                        ).toString()}`}
                        sx={{ width: 32, height: 32 }}
                        onError={(e) => {
                          console.log("Avatar error for user:", user);
                          console.log(
                            "Avatar URL:",
                            `https://www.gravatar.com/avatar/${MD5(
                              user?.email
                            ).toString()}`
                          );
                          // Hide the image and show initials instead
                          e.target.style.display = "none";
                        }}
                      >
                        {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                      </Avatar>
                    </IconButton>
                  </Tooltip>
                  <Menu
                    sx={{ mt: "45px" }}
                    id="menu-appbar"
                    anchorEl={anchorElUser}
                    anchorOrigin={{
                      vertical: "top",
                      horizontal: "right",
                    }}
                    keepMounted
                    transformOrigin={{
                      vertical: "top",
                      horizontal: "right",
                    }}
                    open={Boolean(anchorElUser)}
                    onClose={handleCloseUserMenu}
                  >
                    <MenuItem
                      onClick={() => {
                        handleCloseUserMenu();
                        navigate("/dashboard");
                      }}
                    >
                      <Typography textAlign="center">Dashboard</Typography>
                    </MenuItem>
                    {isAdmin && (
                      <>
                        <Divider />
                        <MenuItem
                          onClick={() => {
                            handleCloseUserMenu();
                            navigate("/admin");
                          }}
                          sx={{
                            color: "primary.main",
                            fontWeight: "bold",
                          }}
                        >
                          <AdminPanelSettings sx={{ mr: 1, fontSize: 20 }} />
                          <Typography textAlign="center">Admin</Typography>
                        </MenuItem>
                      </>
                    )}
                    <Divider />
                    <MenuItem
                      onClick={() => {
                        handleCloseUserMenu();
                        setLogoutDialogOpen(true);
                      }}
                    >
                      <Typography textAlign="center">Logout</Typography>
                    </MenuItem>
                  </Menu>
                </>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: "100%",
            maxWidth: 320,
          },
        }}
      >
        {drawer}
      </Drawer>

      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        aria-labelledby="logout-dialog-title"
        aria-describedby="logout-dialog-description"
      >
        <DialogTitle id="logout-dialog-title">Confirm Logout</DialogTitle>
        <DialogContent>
          <DialogContentText id="logout-dialog-description">
            Are you sure you want to logout?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogoutDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleLogout}
            color="primary"
            variant="contained"
            autoFocus
          >
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Header;
