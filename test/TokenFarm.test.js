const DappToken = artifacts.require('DappToken')
const DaiToken = artifacts.require('DaiToken')
const TokenFarm = artifacts.require('TokenFarm')

require('chai')
    .use(require('chai-as-promised'))
    .should()

const convertEtherToWei = (number) => web3.utils.toWei(number, 'ether')

contract('TokenFarm', ([appAccount, investorAccount]) => {
    let daiToken, dappToken, tokenFarm

    before(async () => {
        daiToken = await DaiToken.new()
        dappToken = await DappToken.new()
        tokenFarm = await TokenFarm.new(dappToken.address, daiToken.address)

        await dappToken.transfer(tokenFarm.address, convertEtherToWei('1000000'))
        await daiToken.transfer(investorAccount, convertEtherToWei('100'), { from: appAccount })
    })

    describe('Mock Dai deployment', async () => {
        it('has a name', async () => {
            const name = await daiToken.name()
            assert.equal(name, 'Mock DAI Token')
        })
    })

    describe('Dapp Token deployment', async () => {
        it('has a name', async () => {
            const name = await dappToken.name()
            assert.equal(name, 'DApp Token')
        })
    })

    describe('Token Farm deployment', async () => {
        it('has a name', async () => {
            const name = await tokenFarm.name()
            assert.equal(name, 'Dapp Token Farm')
        })

        it('has tokens', async () => {
            const balance = await dappToken.balanceOf(tokenFarm.address)
            assert.equal(balance.toString(), convertEtherToWei('1000000'))
        })
    })

    describe('Farming tokens', async () => {
        it('rewards investor for staking mDai tokens', async () => {
            let result = await daiToken.balanceOf(investorAccount)

            assert.equal(result.toString(), convertEtherToWei('100'), 'investor Mock DAI wallet balance correct before staking')


            await daiToken.approve(tokenFarm.address, convertEtherToWei('100'), { from: investorAccount })
            await tokenFarm.stakeTokens(convertEtherToWei('0'), { from: investorAccount }).should.be.rejected
            await tokenFarm.stakeTokens(convertEtherToWei('100'), { from: investorAccount })

            result = await daiToken.balanceOf(investorAccount)
            assert.equal(result.toString(), convertEtherToWei('0'), 'investor Mock DAI wallet balance correct after staking')

            result = await tokenFarm.stakingBalance(investorAccount)
            assert.equal(result.toString(), convertEtherToWei('100'), 'investor stakingBalance correct after staking')

            result = await tokenFarm.isStaking(investorAccount)
            assert.equal(result, true, 'investor isStaking status correct after staking')

            await tokenFarm.issueTokens({ from: appAccount })

            result = await dappToken.balanceOf(investorAccount)
            assert.equal(result.toString(), convertEtherToWei('100'), 'investor DappToken balance correct after staking')

            await tokenFarm.issueTokens({ from: investorAccount }).should.be.rejected;
        })
    })
})