type UserState = {
  verified: boolean
  onboardingStep: number
  roles: string[]
}

const userState: Record<string, UserState> = {}

export function getUserState(userId: string): UserState {
  if (!userState[userId]) {
    userState[userId] = { verified: false, onboardingStep: 0, roles: ['reader'] }
  }
  return userState[userId]
}

export function setUserVerified(userId: string, verified: boolean) {
  getUserState(userId).verified = verified
}

export function resetOnboarding(userId: string) {
  getUserState(userId).onboardingStep = 0
}

export function setUserRoles(userId: string, roles: string[]) {
  getUserState(userId).roles = roles
}



