module.exports = {
  providers: {
    google: {
      enabled: true,
      strategy: 'passport-google-oauth20',
      scope: ['profile', 'email']
    },
    github: {
      enabled: true,
      strategy: 'passport-github2',
      scope: ['user:email']
    },
    facebook: {
      enabled: true,
      strategy: 'passport-facebook',
      scope: []
    },
    instagram: {
      enabled: false,
      strategy: 'passport-instagram',
      scope: ['basic']
    }
  }
}; 