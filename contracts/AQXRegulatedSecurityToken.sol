// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

/**
 * @title AQXRegulatedSecurityToken (Reference Blueprint)
 * @notice Permissioned real-world asset unit contract compatible with ERC-3643 allowlist
 *         controls and ERC-20 balance/transfer semantics.
 *
 * SECURITY NOTICE:
 *   This file is an UNAUDITED architectural reference blueprint for testnet validation.
 *   It MUST undergo formal independent smart-contract security auditing, legal review of
 *   jurisdictional transfer restrictions, and multi-sig/HSM key custody configuration before
 *   any mainnet deployment or regulated asset issuance.
 */
contract AQXRegulatedSecurityToken {
    string public name;
    string public symbol;
    uint8 public constant decimals = 6;
    uint256 public totalSupply;
    uint256 public immutable maxSupplyCap;

    // Digital Asset Passport binding off-chain SPV legal documentation
    string public passportId;
    string public spvLegalEntity;

    address public admin;
    address public complianceOfficer;
    address public issuer;
    address public pauser;

    bool public paused;

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    mapping(address => bool) public verifiedAllowlist;
    mapping(address => bool) public frozenAccounts;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event AllowlistUpdated(address indexed account, bool allowed);
    event AccountFrozen(address indexed account, bool frozen);
    event ForcedRecoveryTransfer(address indexed from, address indexed to, uint256 value, bytes32 legalOrderRef);
    event PausedStateChanged(bool isPaused);

    modifier onlyAdmin() {
        require(msg.sender == admin, "AQX: caller lacks ADMIN role");
        _;
    }

    modifier onlyCompliance() {
        require(msg.sender == complianceOfficer || msg.sender == admin, "AQX: caller lacks COMPLIANCE_ROLE");
        _;
    }

    modifier onlyIssuer() {
        require(msg.sender == issuer || msg.sender == admin, "AQX: caller lacks ISSUER_ROLE");
        _;
    }

    modifier onlyPauser() {
        require(msg.sender == pauser || msg.sender == admin, "AQX: caller lacks PAUSER_ROLE");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "AQX: transfers paused");
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _passportId,
        string memory _spvLegalEntity,
        uint256 _maxSupplyCap,
        address _complianceOfficer,
        address _issuer,
        address _pauser
    ) {
        require(_maxSupplyCap > 0, "AQX: cap must be > 0");
        require(_complianceOfficer != address(0) && _issuer != address(0) && _pauser != address(0), "AQX: zero role address");
        name = _name;
        symbol = _symbol;
        passportId = _passportId;
        spvLegalEntity = _spvLegalEntity;
        maxSupplyCap = _maxSupplyCap;

        admin = msg.sender;
        complianceOfficer = _complianceOfficer;
        issuer = _issuer;
        pauser = _pauser;
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function allowance(address owner, address spender) external view returns (uint256) {
        return _allowances[owner][spender];
    }

    function setAllowlistStatus(address account, bool allowed) external onlyCompliance {
        verifiedAllowlist[account] = allowed;
        emit AllowlistUpdated(account, allowed);
    }

    function setFrozenStatus(address account, bool frozen) external onlyCompliance {
        frozenAccounts[account] = frozen;
        emit AccountFrozen(account, frozen);
    }

    function setPaused(bool _paused) external onlyPauser {
        paused = _paused;
        emit PausedStateChanged(_paused);
    }

    function mint(address to, uint256 amount) external onlyIssuer whenNotPaused {
        require(verifiedAllowlist[to], "AQX: recipient not KYC allowlisted");
        require(!frozenAccounts[to], "AQX: recipient frozen");
        require(totalSupply + amount <= maxSupplyCap, "AQX: exceeds supply cap");

        totalSupply += amount;
        _balances[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function burn(address from, uint256 amount) external onlyIssuer {
        require(_balances[from] >= amount, "AQX: insufficient balance");
        _balances[from] -= amount;
        totalSupply -= amount;
        emit Transfer(from, address(0), amount);
    }

    function approve(address spender, uint256 amount) external whenNotPaused returns (bool) {
        _allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external whenNotPaused returns (bool) {
        _controlledTransfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external whenNotPaused returns (bool) {
        uint256 currentAllowance = _allowances[from][msg.sender];
        require(currentAllowance >= amount, "AQX: insufficient allowance");
        _allowances[from][msg.sender] = currentAllowance - amount;
        _controlledTransfer(from, to, amount);
        return true;
    }

    /**
     * @notice Court-ordered or custodian recovery transfer when an investor loses private keys.
     */
    function forcedRecoveryTransfer(
        address from,
        address to,
        uint256 amount,
        bytes32 legalOrderRef
    ) external onlyCompliance {
        require(verifiedAllowlist[to], "AQX: recovery address not allowlisted");
        require(_balances[from] >= amount, "AQX: insufficient balance");
        _balances[from] -= amount;
        _balances[to] += amount;
        emit ForcedRecoveryTransfer(from, to, amount, legalOrderRef);
        emit Transfer(from, to, amount);
    }

    function _controlledTransfer(address from, address to, uint256 amount) internal {
        require(from != address(0) && to != address(0), "AQX: zero address");
        require(!frozenAccounts[from] && !frozenAccounts[to], "AQX: account frozen");
        require(verifiedAllowlist[from] && verifiedAllowlist[to], "AQX: participant not allowlisted");
        require(_balances[from] >= amount, "AQX: insufficient balance");

        _balances[from] -= amount;
        _balances[to] += amount;
        emit Transfer(from, to, amount);
    }
}
