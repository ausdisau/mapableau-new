package au.com.mapable.feature.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import au.com.mapable.core.auth.AuthRepository
import au.com.mapable.core.common.ApiResult
import au.com.mapable.core.googleplay.CredentialGateway
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class SignInUiState(
    val loading: Boolean = false,
    val error: String? = null,
    val signedIn: Boolean = false,
)

class SignInViewModel(
    private val authRepository: AuthRepository,
    private val credentialGateway: CredentialGateway,
) : ViewModel() {
    private val _state = MutableStateFlow(SignInUiState())
    val state: StateFlow<SignInUiState> = _state

    fun signInPassword(email: String, password: String) {
        viewModelScope.launch {
            _state.value = SignInUiState(loading = true)
            when (val result = authRepository.signInWithPassword(email, password)) {
                is ApiResult.Ok -> _state.value = SignInUiState(signedIn = true)
                is ApiResult.Err -> _state.value = SignInUiState(error = result.message)
            }
        }
    }

    fun signInGoogle() {
        viewModelScope.launch {
            _state.value = SignInUiState(loading = true)
            when (val token = credentialGateway.obtainGoogleIdToken()) {
                is ApiResult.Err ->
                    _state.value = SignInUiState(
                        error = "Google login unavailable — use email/password.",
                    )
                is ApiResult.Ok ->
                    // Server exchange for Google assertion is wired via auth API grantType=google
                    _state.value = SignInUiState(
                        error = "Google assertion received; complete server exchange when enabled.",
                    )
            }
        }
    }
}
